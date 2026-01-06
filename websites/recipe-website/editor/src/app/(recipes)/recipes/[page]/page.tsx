import { getRecipes } from "recipe-website-common/controller/data/read";
import RecipeIndexPage from "recipe-website-common/components/RecipeIndexPage";
import { redirect } from "next/navigation";
import { RECIPES_PER_PAGE } from "recipe-website-common/components/RecipeIndexPage/constants";

export default async function Recipes({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = Number(page);

  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new Error("Invalid page number");
  }
  if (pageNumber === 1) {
    redirect("/recipes");
  }

  const { recipes, more } = await getRecipes({
    offset: (pageNumber - 1) * RECIPES_PER_PAGE,
    limit: RECIPES_PER_PAGE,
  });

  return (
    <RecipeIndexPage recipes={recipes} pageNumber={pageNumber} more={more} />
  );
}
