import { exists, readdir } from "fs-extra";
import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { dropIndex, getContentDatabase, writeToIndex } from "./database";
import { getDataDirectory, readContentFromFilesystem } from "./filesystem";
import type { ContentTypeConfig, RebuildIndexOptions } from "./types";

/**
 * Rebuild the LMDB index from filesystem data
 *
 * This function scans the data directory and rebuilds the entire index
 * by reading each content file and adding it to the index.
 *
 * @example
 * ```ts
 * await rebuildIndex({
 *   config: recipeConfig,
 * });
 * ```
 */
export async function rebuildIndex<
  TData,
  TIndexValue,
  TKey extends Key,
>(options: RebuildIndexOptions<TData, TIndexValue, TKey>): Promise<void> {
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
}

export default rebuildIndex;
