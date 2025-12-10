import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { commitContentChanges } from "../git/commit";
import { getContentDatabase, writeToIndex } from "./database";
import {
  getUploadInfo,
  processUploadChanges,
  writeContentToFilesystem,
} from "./filesystem";
import type {
  ContentTypeConfig,
  CreateContentOptions,
  FileUploadData,
} from "./types";

/**
 * Default upload processor for creating content.
 * Processes each upload field by writing new files.
 */
export async function defaultCreateUploadsProcessor(
  config: ContentTypeConfig,
  slug: string,
  uploads: Record<string, FileUploadData | undefined>,
  contentDirectory: string,
): Promise<void> {
  for (const [, uploadData] of Object.entries(uploads)) {
    await processUploadChanges(
      config,
      slug,
      uploadData,
      undefined, // No existing file for create
      contentDirectory,
    );
  }
}

/**
 * Create new content in the filesystem and index
 *
 * This function orchestrates the full content creation process:
 * 1. Processes any file uploads
 * 2. Writes the data file to the filesystem
 * 3. Adds an entry to the LMDB index
 * 4. Commits the changes to git
 *
 * @example
 * ```ts
 * await createContent({
 *   config: recipeConfig,
 *   slug: "chocolate-cake",
 *   data: { name: "Chocolate Cake", date: Date.now(), ... },
 *   author: { name: "user@example.com", email: "user@example.com" },
 *   uploads: {
 *     image: { file: imageFile },
 *     video: { file: videoFile },
 *   },
 * });
 * ```
 */
export async function createContent<
  TData extends Record<string, unknown>,
  TIndexValue,
  TKey extends Key,
>(
  options: CreateContentOptions<TData, TIndexValue, TKey>,
): Promise<void> {
  const {
    config,
    slug,
    data,
    contentDirectory: providedContentDirectory,
    author,
    commitMessage,
    uploads,
    processUploads = defaultCreateUploadsProcessor,
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();

  // 1. Process uploads
  if (uploads) {
    const resolvedUploads: Record<string, FileUploadData | undefined> = {};
    for (const [fieldName, spec] of Object.entries(uploads)) {
      resolvedUploads[fieldName] = await getUploadInfo(spec);
    }
    await processUploads(
      config as ContentTypeConfig,
      slug,
      resolvedUploads,
      contentDirectory,
    );
  }

  // 2. Write to filesystem
  await writeContentToFilesystem(
    config as ContentTypeConfig,
    slug,
    data,
    contentDirectory,
  );

  // 3. Write to index
  const db = getContentDatabase<TIndexValue, TKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );
  try {
    const indexKey = config.buildIndexKey(slug, data);
    const indexValue = config.buildIndexValue(data);
    await writeToIndex(db, indexKey, indexValue);
  } finally {
    db.close();
  }

  // 4. Commit to git
  const message =
    commitMessage || `Add new ${config.contentType}: ${slug}`;
  await commitContentChanges(message, author);
}

export default createContent;
