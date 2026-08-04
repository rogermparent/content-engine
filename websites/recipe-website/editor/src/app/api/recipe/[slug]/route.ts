import { NextRequest, NextResponse } from "next/server";
import { recipeItems } from "recipe-website-common/controller/data/readRecipeItem";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    /*
     * This 404 branch existed before anything could reach it — the read threw
     * ENOENT and the `catch` below turned a missing recipe into a 500. It is
     * reachable now, so a missing slug answers 404 as the code always said it
     * would, and the `catch` is left for genuine I/O failures.
     */
    const recipe = await recipeItems.read(slug);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 },
    );
  }
}
