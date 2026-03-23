import type { Key } from "lmdb";
import { exists } from "fs-extra";
import { getContentDirectory } from "../fs/getContentDirectory";
import { commitContentChanges } from "../git/commit";
import { getContentDatabase, writeToIndex } from "./database";
import {
  getContentItemDirectory,
  getUploadInfo,
  processUploadChanges,
  writeContentToFilesystem,
} from "./filesystem";
import type {
  ContentTypeConfig,
  CreateContentOptions,
  FileUploadData,
} from "./types";

export class SlugConflictError extends Error {
  constructor(public readonly slug: string) {
    super(`Content with slug "${slug}" already exists`);
    this.name = "SlugConflictError";
  }
}

/**
 * Default upload processor for creating content.
 * Processes each upload field by writing new files.
 */
export async function defaultCreateUploadsProcessor(
  config: ContentTypeConfig,
  slug: string,
  uploads: Record<string, FileUploadData | undefined>,
  contentDirectory: string,
): Promise<string[]> {
  const paths: string[] = [];
  for (const [, uploadData] of Object.entries(uploads)) {
    const uploadPaths = await processUploadChanges(
      config,
      slug,
      uploadData,
      undefined, // No existing file for create
      contentDirectory,
    );
    paths.push(...uploadPaths);
  }
  return paths;
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
export async function createContent<TData, TIndexValue, TKey extends Key>(
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
    action,
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();
  const touchedPaths: string[] = [];

  // 0. Check for slug conflict
  if (action !== "overwrite") {
    const itemDir = getContentItemDirectory(
      config as ContentTypeConfig,
      slug,
      contentDirectory,
    );
    if (await exists(itemDir)) {
      throw new SlugConflictError(slug);
    }
  }

  // 1. Process uploads
  if (uploads) {
    const resolvedUploads: Record<string, FileUploadData | undefined> = {};
    for (const [fieldName, spec] of Object.entries(uploads)) {
      resolvedUploads[fieldName] = await getUploadInfo(spec);
    }
    const uploadPaths = await processUploads(
      config as ContentTypeConfig,
      slug,
      resolvedUploads,
      contentDirectory,
    );
    if (uploadPaths) {
      touchedPaths.push(...uploadPaths);
    }
  }

  // 2. Write to filesystem
  const dataFilePath = await writeContentToFilesystem(
    config as ContentTypeConfig<TData>,
    slug,
    data,
    contentDirectory,
  );
  touchedPaths.push(dataFilePath);

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
  const message = commitMessage || `Add new ${config.contentType}: ${slug}`;
  await commitContentChanges(message, author, touchedPaths);
}

export default createContent;
