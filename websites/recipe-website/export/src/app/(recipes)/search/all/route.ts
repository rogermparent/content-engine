import { getRecipes } from "recipe-website-common/controller/data/read";

// Statically rendered under `output: "export"`: `force-static` is the required
// opt-in for a parameterless route handler, baking the corpus JSON at build
// (like `(recipes)/recipes/page/[page]/route.ts`, which D3 added). This is what
// lets the client's FlexSearch/react-query pipeline resolve on the reader site.
export const dynamic = "force-static";

export async function GET() {
  const { recipes } = await getRecipes();
  return Response.json(recipes);
}
