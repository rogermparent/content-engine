import type { ContentTypeConfig } from "@discontent/cms/content/types";
import buildFeaturedRecipeIndexValue from "./buildFeaturedRecipeIndexValue";
import createDefaultFeaturedRecipeSlug from "./createFeaturedRecipeSlug";
import { recipeContentConfig } from "./recipeContentConfig";
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
  createDefaultSlug: createDefaultFeaturedRecipeSlug,
  /*
   * The inbound half of the edge `recipeContentConfig.referencedBy` declares
   * outbound. Each module names the other, so this import is circular — which
   * is exactly what the thunk is for: without it, whichever module the bundler
   * reached second would evaluate the first's object literal while its `const`
   * was still in the temporal dead zone, and fail at import with a
   * `ReferenceError`.
   *
   * `name` and `image` and nothing else. The list is both the payload and the
   * trigger, so a field `buildIndexValue` reads but this does not name would
   * be a card nothing invalidates.
   */
  references: [
    {
      config: () => recipeContentConfig,
      dataField: "recipe",
      fields: ["name", "image"],
    },
  ],
};

export default featuredRecipeContentConfig;
