import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { commitContentChanges } from "../git/commit";
import { getContentDatabase, removeFromIndex } from "./database";
import { deleteContentFromFilesystem } from "./filesystem";
import type { ContentTypeConfig, DeleteContentOptions } from "./types";

/**
 * Delete content from the filesystem and index
 *
 * This function orchestrates the full content deletion process:
 * 1. Removes the data directory from the filesystem
 * 2. Removes any uploads associated with the content
 * 3. Removes the entry from the LMDB index
 * 4. Commits the changes to git
 *
 * @example
 * ```ts
 * await deleteContent({
 *   config: recipeConfig,
 *   slug: "chocolate-cake",
 *   indexKey: [1738438739783, "chocolate-cake"],
 *   author: { name: "user@example.com", email: "user@example.com" },
 * });
 * ```
 */
export async function deleteContent<
  TData extends Record<string, unknown>,
  TIndexValue,
  TKey extends Key,
>(options: DeleteContentOptions<TData, TIndexValue, TKey>): Promise<void> {
  const {
    config,
    slug,
    indexKey,
    contentDirectory: providedContentDirectory,
    author,
    commitMessage,
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();

  // 1. Delete from filesystem (including uploads)
  await deleteContentFromFilesystem(
    config as ContentTypeConfig,
    slug,
    contentDirectory,
  );

  // 2. Remove from index
  const db = getContentDatabase<TIndexValue, TKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );
  try {
    await removeFromIndex(db, indexKey);
  } finally {
    db.close();
  }

  // 3. Commit to git
  const message =
    commitMessage || `Delete ${config.contentType}: ${slug}`;
  await commitContentChanges(message, author);
}

export default deleteContent;
