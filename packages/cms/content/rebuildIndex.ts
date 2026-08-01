import { exists, readdir } from "fs-extra";
import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { dropIndex, getContentDatabase, writeToIndex } from "./database";
import { recordPaginationChanges } from "../pagination/changes";
import { updatePaginationIndexes } from "../pagination/updatePaginationIndexes";
import { getDataDirectory, readContentFromFilesystem } from "./filesystem";
import type { ContentTypeConfig, RebuildIndexOptions } from "./types";

/**
 * Rebuild the LMDB index from filesystem data
 *
 * This function scans the data directory and rebuilds the entire index
 * by reading each content file and adding it to the index, then rebuilds
 * every pagination index declared on the content type.
 *
 * This is what gives a fresh checkout its pagination indexes: the ~10 callers
 * of `rebuildIndex` — the export action, the sync command, the seed scripts —
 * all inherit it without changing.
 *
 * @example
 * ```ts
 * await rebuildIndex({
 *   config: recipeConfig,
 * });
 * ```
 */
export async function rebuildIndex<TData, TIndexValue, TKey extends Key>(
  options: RebuildIndexOptions<TData, TIndexValue, TKey>,
): Promise<void> {
  const { config, contentDirectory: providedContentDirectory } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();
  const dataDirectory = getDataDirectory(
    config as ContentTypeConfig,
    contentDirectory,
  );

  const db = getContentDatabase<TIndexValue, TKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );
  try {
    // Drop existing index
    await dropIndex(db);

    // Scan data directory and rebuild
    if (await exists(dataDirectory)) {
      const slugDirectories = await readdir(dataDirectory);
      for (const slug of slugDirectories) {
        try {
          const data = await readContentFromFilesystem<TData>(
            config as ContentTypeConfig<TData>,
            slug,
            contentDirectory,
          );
          const indexKey = config.buildIndexKey(slug, data);
          const indexValue = config.buildIndexValue(data);
          await writeToIndex(db, indexKey, indexValue);
        } catch {
          // Skip entries that fail to read
          console.warn(
            `Failed to read ${config.contentType} at ${slug}, skipping`,
          );
        }
      }
    }
  } finally {
    db.close();
  }

  /*
   * Forced, and outside the block above.
   *
   * Forced because this call just dropped and re-derived the content index
   * without touching the sorted keyspace, so meta still matches a spec hash
   * that vouches for nothing — phase 2 alone would walk stale entries for
   * items that are no longer on disk. Outside because the rebuild path opens
   * the content environment itself.
   */
  const results = await updatePaginationIndexes({
    config,
    contentDirectory,
    force: true,
  });
  await recordPaginationChanges({
    contentType: config.contentType,
    contentDirectory,
    results,
  });
}

export default rebuildIndex;
