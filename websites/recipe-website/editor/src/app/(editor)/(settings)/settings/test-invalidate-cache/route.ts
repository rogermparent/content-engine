import { revalidatePath, revalidateTag } from "next/cache";
import { featuredRecipePages } from "recipe-website-common/controller/data/readFeaturedRecipePages";
import { recipePages } from "recipe-website-common/controller/data/readRecipePages";
import { recipeTagIndexReads } from "recipe-website-common/controller/data/readRecipeTagIndex";
import { recipeTagReads } from "recipe-website-common/controller/data/readRecipeTags";

export async function GET() {
  // Only allow in test environment
  if (!process.env.TEST_MODE) {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  revalidatePath("/", "layout");

  /*
   * `revalidatePath` does not touch `unstable_cache` tags, and the pagination
   * reads are cached entirely by tag. Rolling the content directory back to a
   * fixture fires no write path and therefore no tags, so without this a page
   * cached by one test is served to the next one — the suite would be
   * order-dependent in a way that only shows up when tests are resharded.
   *
   * Every keyspace, not just the recipe one — a featured page cached under one
   * fixture is exactly as wrong for the next.
   */
  revalidateTag(recipePages.tags.all, { expire: 0 });
  revalidateTag(featuredRecipePages.tags.all, { expire: 0 });
  /*
   * And the tag aggregate, which is a separate tag from any keyspace's. A
   * rollback that expired only the pagination tags would serve a tag cloud
   * folded from the previous fixture.
   */
  revalidateTag(recipeTagReads.tags.value, { expire: 0 });
  revalidateTag(recipeTagIndexReads.tags.value, { expire: 0 });

  return Response.json({ revalidated: true }, { status: 200 });
}
