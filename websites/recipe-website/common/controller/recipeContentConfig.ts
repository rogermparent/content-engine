import type { ContentTypeConfig } from "content-engine/content/types";
import buildRecipeIndexValue from "./buildIndexValue";
import createDefaultSlug from "./createSlug";
import {
  Recipe,
  RecipeEntryKey,
  RecipeEntryValue,
} from "./types";

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
  createDefaultSlug: (data: Recipe) => createDefaultSlug({ name: data.name }),
};

export default recipeContentConfig;
