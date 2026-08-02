import type { ContentTypeConfig } from "@discontent/cms/content/types";
import buildRecipeIndexValue from "./buildIndexValue";
import createDefaultSlug from "./createSlug";
import { featuredRecipeContentConfig } from "./featuredRecipeContentConfig";
import { recipesByDate } from "./paginationConfigs";
import { Recipe, RecipeEntryKey, RecipeEntryValue } from "./types";

/**
 * Content type configuration for recipes
 */
export const recipeContentConfig: ContentTypeConfig<
  Recipe,
  RecipeEntryValue,
  RecipeEntryKey
> = {
  contentType: "recipes",
  dataDirectory: "recipes/data",
  indexDirectory: "recipes/index",
  dataFilename: "recipe.json",
  uploadsDirectory: "uploads/recipe",
  buildIndexValue: buildRecipeIndexValue,
  buildIndexKey: (slug: string, data: Recipe): RecipeEntryKey => [
    data.date,
    slug,
  ],
  createDefaultSlug: createDefaultSlug,
  referencedBy: [
    {
      config: featuredRecipeContentConfig,
      indexField: "recipe",
    },
  ],
  /*
   * One line turns the whole write path on: every `createContent` /
   * `updateContent` / `deleteContent` now maintains this keyspace and reports
   * which pages it dirtied, and every `rebuildIndex` caller forces a
   * pagination rebuild alongside the content index.
   */
  paginationIndexes: [recipesByDate],
};

export default recipeContentConfig;
