import { createCachedPaginationReads } from "@discontent/cms/pagination/next/cachedReads";
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
 * This is an addition, not a replacement: `getFeaturedRecipes` still serves
 * both homepages' newest-six strip and the export's `featured-recipe/[slug]`
 * `generateStaticParams`, which want the whole index rather than one page of
 * it. The same split P3 kept for `getRecipes`.
 */
export const featuredRecipePages = createCachedPaginationReads<
  FeaturedRecipeEntryValue,
  FeaturedRecipeEntryKey,
  FeaturedRecipeListEntry
>({
  config: featuredRecipeContentConfig,
  paginationConfig: featuredRecipesByDate,
});

export default featuredRecipePages;
