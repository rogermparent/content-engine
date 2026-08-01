import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { commitContentChanges } from "../git/commit";
import { getContentDatabase, removeFromIndex } from "./database";
import { syncPaginationIndexes } from "../pagination/syncContentItem";
import { deleteContentFromFilesystem } from "./filesystem";
import type {
  ContentTypeConfig,
  ContentWriteResult,
  DeleteContentOptions,
} from "./types";

/**
 * Delete content from the filesystem and index
 *
 * This function orchestrates the full content deletion process:
 * 1. Removes the data directory from the filesystem
 * 2. Removes any uploads associated with the content
 * 3. Removes the entry from the LMDB index
 * 4. Brings any declared pagination indexes back in step
 * 5. Commits the changes to git
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
export async function deleteContent<TData, TIndexValue, TKey extends Key>(
  options: DeleteContentOptions<TData, TIndexValue, TKey>,
): Promise<ContentWriteResult> {
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
  const deletedPaths = await deleteContentFromFilesystem(
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

  // 3. Update pagination indexes (outside the block above — see createContent).
  //    No `entry`, which is how phase 1 says "remove this item".
  const pagination = await syncPaginationIndexes({
    config,
    contentDirectory,
    id: slug,
  });

  // 4. Commit to git
  const message = commitMessage || `Delete ${config.contentType}: ${slug}`;
  await commitContentChanges(message, author, deletedPaths);

  return { pagination };
}

export default deleteContent;
