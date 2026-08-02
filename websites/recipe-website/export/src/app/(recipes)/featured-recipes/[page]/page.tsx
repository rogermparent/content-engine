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
  /*
   * `ceil`, where this used to count `i * perPage <= length`. That bound
   * emitted one page too many whenever the count divided evenly, and the extra
   * page rendered empty.
   *
   * The `max(1, …)` is not cosmetic: `output: export` rejects a dynamic route
   * whose `generateStaticParams` returns an empty array outright ("Page … is
   * missing generateStaticParams()"), so an empty corpus still has to emit
   * page 1. That is what the old `<=` bound was quietly providing.
   */
  const pageCount = Math.max(
    1,
    Math.ceil(featuredRecipes.length / FEATURED_RECIPES_PER_PAGE),
  );
  return Array.from({ length: pageCount }, (_, i) => ({
    page: String(i + 1),
  }));
}
