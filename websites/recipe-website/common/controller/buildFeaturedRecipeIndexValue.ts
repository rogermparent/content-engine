import {
  borrowed,
  type ResolvedReferences,
} from "@discontent/cms/content/references";
import { FeaturedRecipe, FeaturedRecipeEntryValue, Recipe } from "./types";

export default function buildFeaturedRecipeIndexValue(
  featuredRecipe: FeaturedRecipe,
  refs: ResolvedReferences,
): FeaturedRecipeEntryValue {
  const { recipe, note } = featuredRecipe;
  const referenced = borrowed<Recipe>(refs, "recipe");
  return {
    recipe,
    note,
    /*
     * Pure and synchronous: the engine already read the recipe and handed the
     * declared fields over. Reading anything the `references` declaration does
     * not name would be a value nothing invalidates — a stale card with no
     * write to blame.
     */
    recipeName: referenced?.name,
    recipeImage: referenced?.image,
  };
}
