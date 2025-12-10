import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { commitContentChanges } from "../git/commit";
import {
  getContentDatabase,
  removeFromIndex,
  writeToIndex,
} from "./database";
import {
  getUploadInfo,
  processUploadChanges,
  renameContentDirectory,
  writeContentToFilesystem,
} from "./filesystem";
import type {
  ContentTypeConfig,
  FileUploadData,
  UpdateContentOptions,
  UploadSpec,
} from "./types";

/**
 * Default upload processor for updating content.
 * Handles directory renames, removes old files, and writes new files.
 */
export async function defaultUpdateUploadsProcessor(
  config: ContentTypeConfig,
  slug: string,
  uploads: Record<string, FileUploadData | undefined>,
  contentDirectory: string,
  currentSlug: string,
  uploadSpecs: Record<string, UploadSpec>,
): Promise<void> {
  // Process uploads at current slug location before rename
  for (const [fieldName, uploadData] of Object.entries(uploads)) {
    const existingFile = uploadSpecs[fieldName]?.existingFile;
    await processUploadChanges(
      config,
      currentSlug,
      uploadData,
      existingFile,
      contentDirectory,
    );
  }
}

/**
 * Update existing content in the filesystem and index
 *
 * This function orchestrates the full content update process:
 * 1. Processes any file uploads (at current slug location)
 * 2. Renames directories if slug changed
 * 3. Writes the data file to the filesystem
 * 4. Updates the LMDB index (removes old entry if key changed, writes new)
 * 5. Commits the changes to git
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
export async function updateContent<
  TData extends Record<string, unknown>,
  TIndexValue,
  TKey extends Key,
>(options: UpdateContentOptions<TData, TIndexValue, TKey>): Promise<void> {
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

  // 1. Process uploads at current slug location (before rename)
  if (uploads) {
    const resolvedUploads: Record<string, FileUploadData | undefined> = {};
    for (const [fieldName, spec] of Object.entries(uploads)) {
      resolvedUploads[fieldName] = await getUploadInfo(spec);
    }

    const uploadProcessor = processUploads || defaultUpdateUploadsProcessor;
    await uploadProcessor(
      config as ContentTypeConfig,
      slug,
      resolvedUploads,
      contentDirectory,
      currentSlug,
      uploads,
    );
  }

  // 2. Rename directories if slug changed
  if (willRename) {
    await renameContentDirectory(
      config as ContentTypeConfig,
      currentSlug,
      slug,
      contentDirectory,
    );
  }

  // 3. Write to filesystem
  await writeContentToFilesystem(
    config as ContentTypeConfig,
    slug,
    data,
    contentDirectory,
  );

  // 4. Update index
  const db = getContentDatabase<TIndexValue, TKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );
  try {
    const newIndexKey = config.buildIndexKey(slug, data);
    const indexValue = config.buildIndexValue(data);

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

  // 5. Commit to git
  const message =
    commitMessage || `Update ${config.contentType}: ${slug}`;
  await commitContentChanges(message, author);
}

export default updateContent;
