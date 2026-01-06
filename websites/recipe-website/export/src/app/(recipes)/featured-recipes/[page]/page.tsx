import { getFeaturedRecipes } from "recipe-website-common/controller/data/readFeaturedRecipes";
import FeaturedRecipeIndexPage from "recipe-website-common/components/FeaturedRecipeIndexPage";
import { redirect } from "next/navigation";
import { FEATURED_RECIPES_PER_PAGE } from "recipe-website-common/components/FeaturedRecipeIndexPage/constants";

export default async function FeaturedRecipes({
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
    redirect("/featured-recipes");
  }

  const { featuredRecipes, more } = await getFeaturedRecipes({
    offset: (pageNumber - 1) * FEATURED_RECIPES_PER_PAGE,
    limit: FEATURED_RECIPES_PER_PAGE,
  });

  return (
    <FeaturedRecipeIndexPage
      featuredRecipes={featuredRecipes}
      pageNumber={pageNumber}
      more={more}
    />
  );
}

export async function generateStaticParams() {
  const { featuredRecipes } = await getFeaturedRecipes();
  const indexPageParams = [];
  for (
    let i = 0;
    i * FEATURED_RECIPES_PER_PAGE <= featuredRecipes.length;
    i++
  ) {
    indexPageParams.push({ page: String(i + 1) });
  }
  return indexPageParams;
}
