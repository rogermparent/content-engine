import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { commitContentChanges } from "../git/commit";
import { getContentDatabase, removeFromIndex, writeToIndex } from "./database";
import {
  getUploadInfo,
  processUploadChanges,
  renameContentDirectory,
  writeContentToFilesystem,
} from "./filesystem";
import { recordPaginationChanges } from "../pagination/changes";
import { syncPaginationIndexes } from "../pagination/syncContentItem";
import { updatePaginationIndexes } from "../pagination/updatePaginationIndexes";
import type {
  ContentTypeConfig,
  ContentWriteResult,
  FileUploadData,
  UpdateContentOptions,
  UploadSpec,
} from "./types";
import { updateReferences } from "./updateReferences";

/**
 * Default upload processor for updating content.
 * Handles directory renames, removes old files, and writes new files.
 */
export async function defaultUpdateUploadsProcessor(
  config: ContentTypeConfig,
  /* Uploads are processed at the *current* slug, before any rename. */
  _slug: string,
  uploads: Record<string, FileUploadData | undefined>,
  contentDirectory: string,
  currentSlug: string,
  uploadSpecs: Record<string, UploadSpec>,
): Promise<string[]> {
  const paths: string[] = [];
  // Process uploads at current slug location before rename
  for (const [fieldName, uploadData] of Object.entries(uploads)) {
    const existingFile = uploadSpecs[fieldName]?.existingFile;
    const uploadPaths = await processUploadChanges(
      config,
      currentSlug,
      uploadData,
      existingFile,
      contentDirectory,
    );
    paths.push(...uploadPaths);
  }
  return paths;
}

/**
 * Update existing content in the filesystem and index
 *
 * This function orchestrates the full content update process:
 * 1. Processes any file uploads (at current slug location)
 * 2. Renames directories if slug changed
 * 3. Writes the data file to the filesystem
 * 4. Updates the LMDB index (removes old entry if key changed, writes new)
 * 5. Brings any declared pagination indexes back in step
 * 6. Updates references in content that references this type
 * 7. Commits the changes to git
 *
 * @example
 * ```ts
 * await updateContent({
 *   config: recipeConfig,
 *   slug: "chocolate-cake-deluxe",
 *   currentSlug: "chocolate-cake",
 *   currentIndexKey: [1738438739783, "chocolate-cake"],
 *   data: { name: "Chocolate Cake Deluxe", date: 1738438739783, ... },
 *   author: { name: "user@example.com", email: "user@example.com" },
 *   uploads: {
 *     image: { file: newImageFile, existingFile: "old-image.jpg" },
 *   },
 * });
 * ```
 */
export async function updateContent<TData, TIndexValue, TKey extends Key>(
  options: UpdateContentOptions<TData, TIndexValue, TKey>,
): Promise<ContentWriteResult> {
  const {
    config,
    slug,
    currentSlug,
    currentIndexKey,
    data,
    contentDirectory: providedContentDirectory,
    author,
    commitMessage,
    uploads,
    processUploads,
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();
  const willRename = currentSlug !== slug;
  const touchedPaths: string[] = [];

  // 1. Process uploads at current slug location (before rename)
  if (uploads) {
    const resolvedUploads: Record<string, FileUploadData | undefined> = {};
    for (const [fieldName, spec] of Object.entries(uploads)) {
      resolvedUploads[fieldName] = await getUploadInfo(spec);
    }

    const uploadProcessor = processUploads || defaultUpdateUploadsProcessor;
    const uploadPaths = await uploadProcessor(
      config as ContentTypeConfig,
      slug,
      resolvedUploads,
      contentDirectory,
      currentSlug,
      uploads,
    );
    if (uploadPaths) {
      touchedPaths.push(...uploadPaths);
    }
  }

  // 2. Rename directories if slug changed
  if (willRename) {
    const renamePaths = await renameContentDirectory(
      config as ContentTypeConfig,
      currentSlug,
      slug,
      contentDirectory,
    );
    touchedPaths.push(...renamePaths);
  }

  // 3. Write to filesystem
  const dataFilePath = await writeContentToFilesystem(
    config as ContentTypeConfig<TData>,
    slug,
    data,
    contentDirectory,
  );
  touchedPaths.push(dataFilePath);

  // 4. Update index
  const newIndexKey = config.buildIndexKey(slug, data);
  const indexValue = config.buildIndexValue(data);
  const db = getContentDatabase<TIndexValue, TKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );
  try {
    // Check if key changed (we need to stringify to compare complex keys)
    const keyChanged =
      JSON.stringify(newIndexKey) !== JSON.stringify(currentIndexKey);

    if (keyChanged) {
      await removeFromIndex(db, currentIndexKey);
    }

    await writeToIndex(db, newIndexKey, indexValue);
  } finally {
    db.close();
  }

  // 5. Update pagination indexes (outside the block above — see createContent)
  const pagination = await syncPaginationIndexes({
    config,
    contentDirectory,
    id: slug,
    previousId: willRename ? currentSlug : undefined,
    entry: { key: newIndexKey, value: indexValue },
  });

  // 6. Update references in content that references this type
  if (willRename && config.referencedBy && config.referencedBy.length > 0) {
    const refResults = await updateReferences({
      oldSlug: currentSlug,
      newSlug: slug,
      referenceSpecs: config.referencedBy,
      contentDirectory,
    });
    for (const refResult of refResults) {
      touchedPaths.push(...refResult.updatedPaths);
    }

    /*
     * `updateReferences` writes the referencing type's index entries directly,
     * so its pagination would drift silently. A forced rebuild re-derives from
     * the content index it just corrected, which is obviously right where
     * threading the changed keys and values back out of `updateReferences`
     * would be a second place to get the projection wrong.
     *
     * It over-invalidates — every page of the referencing type reads as dirty.
     * Renames are rare and corpora are small; narrowing it is F15.
     */
    for (const spec of config.referencedBy) {
      if (!spec.config.paginationIndexes?.length) continue;
      const referenceResults = await updatePaginationIndexes({
        config: spec.config,
        contentDirectory,
        force: true,
      });
      await recordPaginationChanges({
        contentType: spec.config.contentType,
        contentDirectory,
        results: referenceResults,
      });
    }
  }

  // 7. Commit to git
  const message = commitMessage || `Update ${config.contentType}: ${slug}`;
  await commitContentChanges(message, author, touchedPaths);

  return { pagination };
}

export default updateContent;
