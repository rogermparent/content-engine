import type { Key } from "lmdb";
import { recordPaginationChanges } from "./changes";
import type {
  PaginationIndexConfig,
  PaginationUpdateResult,
  SyncPaginationOptions,
} from "./types";
import { updatePaginationIndexes } from "./updatePaginationIndexes";
import { writeSortedEntry } from "./writeSortedEntry";

/**
 * The single call the content layer makes after writing one item.
 *
 * Runs phase 1 for every declared index, then phase 2 once, then records the
 * dirty pages. A content type that declares no indexes returns `[]` having
 * opened nothing and written nothing — which is what makes wiring this into
 * the shared write path a no-op for every content type that has not opted in.
 *
 * Must be called *after* the content index environment is closed: the rebuild
 * path inside phase 2 opens that environment itself to re-read the corpus.
 *
 * @example
 * ```ts
 * const pagination = await syncPaginationIndexes({
 *   config: recipeConfig,
 *   contentDirectory,
 *   id: "chocolate-cake",
 *   entry: { key: indexKey, value: indexValue },
 * });
 * ```
 */
export async function syncPaginationIndexes<TIndexValue, TKey extends Key>(
  options: SyncPaginationOptions<TIndexValue, TKey>,
): Promise<PaginationUpdateResult[]> {
  const { config, contentDirectory, id, previousId, entry } = options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indexes: PaginationIndexConfig<any, any, any>[] =
    config.paginationIndexes ?? [];
  if (indexes.length === 0) return [];

  /*
   * Each index lives in its own environment, so phase 1 across indexes has
   * nothing to contend over.
   */
  await Promise.all(
    indexes.map(async (paginationConfig) => {
      /*
       * The id *is* the slug, so a rename is a delete plus an insert. Removing
       * first matters: both entries would otherwise sit in the sorted keyspace
       * at once, and the walk would count the item twice.
       */
      if (previousId !== undefined && previousId !== id) {
        await writeSortedEntry({
          config,
          paginationConfig,
          contentDirectory,
          id: previousId,
        });
      }
      await writeSortedEntry({
        config,
        paginationConfig,
        contentDirectory,
        id,
        entry,
      });
    }),
  );

  const results = await updatePaginationIndexes({ config, contentDirectory });
  await recordPaginationChanges({
    contentType: config.contentType,
    contentDirectory,
    results,
  });
  return results;
}

export default syncPaginationIndexes;
