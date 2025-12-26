import { open, RootDatabase, Key, RangeIterable } from "lmdb";
import { resolve } from "path";
import { getContentDirectory } from "../fs/getContentDirectory";
import type { ContentTypeConfig } from "./types";

/**
 * Get the path to the LMDB index directory for a content type
 */
export function getIndexDirectory(
  config: ContentTypeConfig,
  contentDirectory?: string,
): string {
  const baseDir = contentDirectory || getContentDirectory();
  return resolve(baseDir, config.indexDirectory);
}

/**
 * Open a database for a specific content type configuration
 * The key type is flexible to support different content types (can be string, number, array, etc.)
 */
export function getContentDatabase<
  TIndexValue = unknown,
  TKey extends Key = Key,
>(
  config: ContentTypeConfig,
  contentDirectory?: string,
): RootDatabase<TIndexValue, TKey> {
  return open<TIndexValue, TKey>({
    path: getIndexDirectory(config, contentDirectory),
  });
}

/**
 * Write an entry to the content index
 */
export async function writeToIndex<
  TIndexValue = unknown,
  TKey extends Key = Key,
>(
  db: RootDatabase<TIndexValue, TKey>,
  key: TKey,
  value: TIndexValue,
): Promise<void> {
  await db.put(key, value);
}

/**
 * Remove an entry from the content index
 */
export async function removeFromIndex<
  TIndexValue = unknown,
  TKey extends Key = Key,
>(db: RootDatabase<TIndexValue, TKey>, key: TKey): Promise<void> {
  await db.remove(key);
}

/**
 * Read entries from the content index with pagination
 */
export function readFromIndex<TIndexValue = unknown, TKey extends Key = Key>(
  db: RootDatabase<TIndexValue, TKey>,
  options: {
    limit?: number;
    offset?: number;
    reverse?: boolean;
  } = {},
): RangeIterable<{ key: TKey; value: TIndexValue }> {
  const { limit, offset, reverse = true } = options;
  const range = db.getRange({ limit, offset, reverse });
  const mapped = range.map(({ key, value }) => ({ key, value }));
  return mapped;
}

/**
 * Get the total count of entries in the index
 */
export function getIndexCount<TIndexValue = unknown, TKey extends Key = Key>(
  db: RootDatabase<TIndexValue, TKey>,
): number {
  return db.getCount();
}

/**
 * Drop all entries from the index (for rebuilding)
 */
export async function dropIndex<TIndexValue = unknown, TKey extends Key = Key>(
  db: RootDatabase<TIndexValue, TKey>,
): Promise<void> {
  await db.drop();
}
