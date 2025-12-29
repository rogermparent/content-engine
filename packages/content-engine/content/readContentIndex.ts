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
export async function readContentIndex<
  TIndexValue,
  TKey extends Key,
  TResult = { key: TKey; value: TIndexValue },
>(
  options: ReadContentIndexOptions<TIndexValue, TKey, TResult>,
): Promise<ReadContentIndexResult<TIndexValue, TKey, TResult>> {
  const {
    config,
    limit,
    offset,
    reverse = true,
    contentDirectory: providedContentDirectory,
    map = ({ key, value }) => ({ key, value }),
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
    }).map(map as (entry: { key: TKey; value: TIndexValue }) => TResult);
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
