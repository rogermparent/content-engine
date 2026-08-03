import { createCachedPaginationReads } from "@discontent/cms/pagination/next/cachedReads";
import { recipesByDate, type RecipeListEntry } from "../paginationConfigs";
import { recipeContentConfig } from "../recipeContentConfig";
import type { RecipeEntryKey, RecipeEntryValue } from "../types";

/**
 * The cached reads for the recipe index, shared by the editor and the export.
 *
 * Built at module scope rather than per request so the `React.cache` wrappers
 * inside survive long enough to dedupe anything — a factory called per render
 * would hand back fresh, empty memo tables every time.
 *
 * These serve every recipe surface that renders a list: the `/recipes`
 * landing and its numbered pages, and — since the homepage strips moved onto
 * `readHead` — the newest-six strip too. What is left on `getRecipes` wants
 * the whole index rather than one page of it: `getAllTags`, the `search/all`
 * corpus, and the export's `recipe/[slug]` `generateStaticParams`.
 */
export const recipePages = createCachedPaginationReads<
  RecipeEntryValue,
  RecipeEntryKey,
  RecipeListEntry
>({
  config: recipeContentConfig,
  paginationConfig: recipesByDate,
});

export default recipePages;
