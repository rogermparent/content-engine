import { getRecipes } from "recipe-website-common/controller/data/read";
import FirstRecipeIndexPage from "recipe-website-common/components/RecipeIndexPage/FirstRecipeIndexPage";
import { RECIPES_PER_PAGE } from "recipe-website-common/components/RecipeIndexPage/constants";

export default async function Recipes() {
  const { recipes, more } = await getRecipes({ limit: RECIPES_PER_PAGE });

  return <FirstRecipeIndexPage recipes={recipes} more={more} />;
}
