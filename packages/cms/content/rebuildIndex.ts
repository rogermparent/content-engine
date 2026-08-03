import { exists, readdir } from "fs-extra";
import type { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { dropIndex, getContentDatabase, writeToIndex } from "./database";
import { recordPaginationChanges } from "../pagination/changes";
import { updatePaginationIndexes } from "../pagination/updatePaginationIndexes";
import { getDataDirectory, readContentFromFilesystem } from "./filesystem";
import { createReferenceResolver, resolveReferences } from "./references";
import type { ContentTypeConfig, RebuildIndexOptions } from "./types";

/**
 * Rebuild the LMDB index from filesystem data
 *
 * This function scans the data directory and rebuilds the entire index by
 * reading each content file, resolving the references it declares and adding
 * it to the index, then rebuilds every pagination index declared on the
 * content type — and then does the same for every type that borrows from it.
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
  const {
    config,
    contentDirectory: providedContentDirectory,
    cascadeDependents = true,
    visited = new Set<string>(),
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();
  visited.add(config.contentType);
  const dataDirectory = getDataDirectory(
    config as ContentTypeConfig,
    contentDirectory,
  );

  /*
   * Hoisted out of the loop below, so a corpus of N items referencing the same
   * target reads that target's data file once rather than N times.
   */
  const resolver = createReferenceResolver(contentDirectory);

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
          const refs = await resolveReferences({ config, data, resolver });
          const indexKey = config.buildIndexKey(slug, data);
          const indexValue = config.buildIndexValue(data, refs);
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

  /*
   * Then everything that borrows from what we just re-derived.
   *
   * `rebuildRecipeIndex()` rebuilds recipes and nothing else, and it is what
   * the export action, the sync command and the maintenance button call. A
   * dependent's index value holds fields copied out of recipe data files, and
   * the content index carries no spec hash to notice they went stale — so
   * without this, "rebuild everything" would quietly not.
   *
   * `visited` bounds it: an edge declared in both directions between two types
   * is a cycle, and this is the one place that walks edges transitively.
   */
  if (!cascadeDependents) return;
  for (const spec of config.referencedBy ?? []) {
    const dependentConfig = spec.config();
    if (visited.has(dependentConfig.contentType)) continue;
    await rebuildIndex({
      config: dependentConfig,
      contentDirectory,
      cascadeDependents,
      visited,
    });
  }
}

export default rebuildIndex;
