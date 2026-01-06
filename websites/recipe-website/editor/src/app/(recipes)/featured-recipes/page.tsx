import { getFeaturedRecipes } from "recipe-website-common/controller/data/readFeaturedRecipes";
import FirstFeaturedRecipeIndexPage from "recipe-website-common/components/FeaturedRecipeIndexPage/FirstFeaturedRecipeIndexPage";
import { FEATURED_RECIPES_PER_PAGE } from "recipe-website-common/components/FeaturedRecipeIndexPage/constants";

export default async function FeaturedRecipes() {
  const { featuredRecipes, more } = await getFeaturedRecipes({
    limit: FEATURED_RECIPES_PER_PAGE,
  });

  return (
    <FirstFeaturedRecipeIndexPage
      featuredRecipes={featuredRecipes}
      more={more}
    />
  );
}
