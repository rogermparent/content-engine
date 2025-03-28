import { RECIPES_PER_SEARCH_PAGE } from "recipe-website-common/components/SearchForm/constants";
import getRecipes from "recipe-website-common/controller/data/readIndex";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ page: string }>;
  },
) {
  const { page } = await params;
  const pageNumber = Number(page);

  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new Error("Invalid page number");
  }

  const { recipes, more } = await getRecipes({
    offset: (pageNumber - 1) * RECIPES_PER_SEARCH_PAGE,
    limit: RECIPES_PER_SEARCH_PAGE,
  });

  return Response.json({ recipes, more });
}
