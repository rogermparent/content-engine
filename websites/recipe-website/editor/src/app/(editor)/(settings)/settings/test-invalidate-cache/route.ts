import { revalidatePath, revalidateTag } from "next/cache";
import { recipePages } from "recipe-website-common/controller/data/readRecipePages";

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
   */
  revalidateTag(recipePages.tags.all, { expire: 0 });

  return Response.json({ revalidated: true }, { status: 200 });
}
