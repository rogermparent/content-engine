import { FeaturedRecipe, FeaturedRecipeEntryValue } from "./types";

export default function buildFeaturedRecipeIndexValue(
  featuredRecipe: FeaturedRecipe,
): FeaturedRecipeEntryValue {
  const { recipe, note } = featuredRecipe;
  return {
    recipe,
    note,
  };
}
