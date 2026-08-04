import { createCachedPaginationReads } from "@discontent/cms/pagination/next/cachedReads";
import { readAllIds } from "@discontent/cms/pagination/readAllIds";
import { featuredRecipeContentConfig } from "../featuredRecipeContentConfig";
import {
  featuredRecipesByDate,
  type FeaturedRecipeListEntry,
} from "../paginationConfigs";
import type {
  FeaturedRecipeEntryKey,
  FeaturedRecipeEntryValue,
} from "../types";

/**
 * The cached reads for the featured-recipe index, shared by the editor and the
 * export.
 *
 * Built at module scope rather than per request so the `React.cache` wrappers
 * inside survive long enough to dedupe anything — a factory called per render
 * would hand back fresh, empty memo tables every time.
 *
 * These serve every featured surface that renders a list: the
 * `/featured-recipes` landing and its numbered pages, and — since the
 * homepage strips moved onto `readHead` — the newest-six strip too. Since F7
 * moved `generateStaticParams` onto the keyspace, `getFeaturedRecipes` has no
 * caller here at all.
 */
export const featuredRecipePages = createCachedPaginationReads<
  FeaturedRecipeEntryValue,
  FeaturedRecipeEntryKey,
  FeaturedRecipeListEntry
>({
  config: featuredRecipeContentConfig,
  paginationConfig: featuredRecipesByDate,
});

/**
 * Every featured-recipe slug, for the export's `featured-recipe/[slug]`
 * `generateStaticParams` (F7). See `readAllRecipeIds` on why this is not one
 * of the cached reads above.
 *
 * Unblocked by D2b, which is what gave featured recipes a keyspace of their
 * own to walk.
 */
export function readAllFeaturedRecipeIds(): Promise<string[]> {
  return readAllIds<
    FeaturedRecipeEntryValue,
    FeaturedRecipeEntryKey,
    FeaturedRecipeListEntry
  >({
    config: featuredRecipeContentConfig,
    paginationConfig: featuredRecipesByDate,
  });
}

export default featuredRecipePages;
