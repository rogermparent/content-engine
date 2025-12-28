import type { ContentTypeConfig } from "content-engine/content/types";
import buildFeaturedRecipeIndexValue from "./buildFeaturedRecipeIndexValue";
import createDefaultFeaturedRecipeSlug from "./createFeaturedRecipeSlug";
import {
  FeaturedRecipe,
  FeaturedRecipeEntryKey,
  FeaturedRecipeEntryValue,
} from "./types";

/**
 * Content type configuration for featured recipes
 */
export const featuredRecipeContentConfig: ContentTypeConfig<
  FeaturedRecipe,
  FeaturedRecipeEntryValue,
  FeaturedRecipeEntryKey
> = {
  contentType: "featured-recipes",
  dataDirectory: "featured-recipes/data",
  indexDirectory: "featured-recipes/index",
  dataFilename: "featured-recipe.json",
  buildIndexValue: buildFeaturedRecipeIndexValue,
  buildIndexKey: (
    slug: string,
    data: FeaturedRecipe,
  ): FeaturedRecipeEntryKey => [data.date, slug],
  createDefaultSlug: (data: FeaturedRecipe) =>
    createDefaultFeaturedRecipeSlug({ date: data.date }),
};

export default featuredRecipeContentConfig;
