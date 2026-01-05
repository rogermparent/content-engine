import { getFeaturedRecipes } from "recipe-website-common/controller/data/readFeaturedRecipes";
import FeaturedRecipesPage from "recipe-website-common/components/FeaturedRecipesPage";

export default async function FeaturedRecipes() {
  const { featuredRecipes } = await getFeaturedRecipes({ limit: 10 });

  return <FeaturedRecipesPage featuredRecipes={featuredRecipes} />;
}
