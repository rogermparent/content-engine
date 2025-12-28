import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { getContentDatabase, getIndexCount, readFromIndex } from "./database";
import type {
  ContentTypeConfig,
  ReadContentIndexOptions,
  ReadContentIndexResult,
} from "./types";

/**
 * Read entries from the content index with pagination
 *
 * @example
 * ```ts
 * const { entries, total, more } = await readContentIndex({
 *   config: recipeConfig,
 *   limit: 10,
 *   offset: 0,
 *   reverse: true,
 * });
 * ```
 */
export async function readContentIndex<TIndexValue, TKey extends Key>(
  options: ReadContentIndexOptions<TIndexValue, TKey>,
): Promise<ReadContentIndexResult<TIndexValue, TKey>> {
  const {
    config,
    limit,
    offset,
    reverse = true,
    contentDirectory: providedContentDirectory,
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();

  const db = getContentDatabase<TIndexValue, TKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );
  try {
    const entriesIterator = readFromIndex<TIndexValue, TKey>(db, {
      limit,
      offset,
      reverse,
    });
    const entriesPromise = entriesIterator.asArray;
    const entries = await entriesPromise;
    const total = getIndexCount(db);
    const more = (offset || 0) + (limit || 0) < total;

    return { entries, total, more };
  } finally {
    db.close();
  }
}

export default readContentIndex;
