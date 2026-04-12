import { getRecipes } from "recipe-website-common/controller/data/read";

export async function GET() {
  const { recipes } = await getRecipes();
  return Response.json(recipes);
}
