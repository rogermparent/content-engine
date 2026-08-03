import type { Key } from "lmdb";
import { recordPaginationChanges } from "./changes";
import { getPaginationDatabase } from "./database";
import type {
  PaginationIndexConfig,
  PaginationUpdateResult,
  SyncPaginationItemsOptions,
} from "./types";
import { updatePaginationIndexes } from "./updatePaginationIndexes";
import { writeSortedEntryTo } from "./writeSortedEntry";

/**
 * The call the content layer makes after writing *several* items of one type.
 *
 * Phase 1 runs for every item inside **one transaction per index**, then phase
 * 2 runs **once**. Phase 2 walks the whole sorted keyspace, so running it per
 * item would cost K walks to reach a state one walk already describes — and
 * the intermediate results would be diffs against states no build ever sees.
 * That is what makes a write with K dependents cost the same phase 2 as a
 * write with one.
 *
 * A content type that declares no indexes, or a call with no items, returns
 * `[]` having opened nothing and written nothing.
 *
 * Must be called *after* the content index environment is closed: the rebuild
 * path inside phase 2 opens that environment itself.
 *
 * @example
 * ```ts
 * const pagination = await syncPaginationItems({
 *   config: featuredRecipeConfig,
 *   contentDirectory,
 *   items: [
 *     { id: "monday", entry: { key, value } },
 *     { id: "tuesday", entry: { key: otherKey, value: otherValue } },
 *   ],
 * });
 * ```
 */
export async function syncPaginationItems<TIndexValue, TKey extends Key>(
  options: SyncPaginationItemsOptions<TIndexValue, TKey>,
): Promise<PaginationUpdateResult[]> {
  const { config, contentDirectory, items } = options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indexes: PaginationIndexConfig<any, any, any>[] =
    config.paginationIndexes ?? [];
  if (indexes.length === 0 || items.length === 0) return [];

  /*
   * Each index lives in its own environment, so phase 1 across indexes has
   * nothing to contend over — but every item of one index shares a single
   * transaction.
   */
  await Promise.all(
    indexes.map(async (paginationConfig) => {
      const db = getPaginationDatabase(
        config,
        paginationConfig,
        contentDirectory,
      );
      await db.transaction(() => {
        for (const { id, previousId, entry } of items) {
          /*
           * The id *is* the slug, so a rename is a delete plus an insert.
           * Removing first matters: both entries would otherwise sit in the
           * sorted keyspace at once, and the walk would count the item twice.
           */
          if (previousId !== undefined && previousId !== id) {
            writeSortedEntryTo(db, paginationConfig, previousId);
          }
          writeSortedEntryTo(db, paginationConfig, id, entry);
        }
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

export default syncPaginationItems;
