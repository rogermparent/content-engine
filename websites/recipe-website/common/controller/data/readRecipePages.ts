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
 * This is an addition, not a replacement: `getRecipes` still serves the
 * homepage's newest-six strip, `getAllTags` and the search corpus, all of
 * which want the whole index rather than one page of it.
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
