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
 * These serve every featured surface that renders a list: the
 * `/featured-recipes` landing and its numbered pages, and — since the
 * homepage strips moved onto `readHead` — the newest-six strip too. The one
 * caller left on `getFeaturedRecipes` is the export's
 * `featured-recipe/[slug]` `generateStaticParams`, which wants the whole
 * index rather than one page of it.
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
