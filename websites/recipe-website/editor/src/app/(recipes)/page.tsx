import Homepage from "recipe-website-common/components/Homepage";
import {
  getRecipes,
  MassagedRecipeEntry,
} from "recipe-website-common/controller/data/read";
import { getFeaturedRecipes } from "recipe-website-common/controller/data/readFeaturedRecipes";

export default async function Home() {
  const { recipes, more } = await getRecipes({ limit: 6 });
  const { featuredRecipes } = await getFeaturedRecipes({ limit: 6 });

  const featuredAsRecipes: MassagedRecipeEntry[] = featuredRecipes
    .filter((f) => f.recipeName)
    .map((f) => ({
      slug: f.recipe,
      date: f.date,
      name: f.recipeName!,
      image: f.recipeImage,
    }));

  return (
    <Homepage
      recipes={recipes}
      featuredRecipes={featuredAsRecipes}
      moreRecipes={more}
    />
  );
}
