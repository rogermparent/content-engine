import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import { RecipeView } from "recipe-website-common/components/View";
import { deleteFeaturedRecipe } from "../../../../../controller/actions/featuredRecipes";
import { Button, buttonVariants } from "component-library/components/ui/button";
import Markdown from "component-library/components/Markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let featuredRecipe;
  try {
    featuredRecipe = await getFeaturedRecipeBySlug({ slug });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  let recipe;
  try {
    recipe = await getRecipeBySlug({ slug: featuredRecipe.recipe });
  } catch {
    // Recipe might not exist
  }
  return { title: recipe?.name || featuredRecipe.recipe || slug };
}

export default async function FeaturedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let featuredRecipe;
  try {
    featuredRecipe = await getFeaturedRecipeBySlug({ slug });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const { date, recipe: recipeSlug, note } = featuredRecipe;

  let recipe;
  try {
    recipe = await getRecipeBySlug({ slug: recipeSlug });
  } catch {
    notFound();
  }

  const deleteFeaturedRecipeWithSlug = deleteFeaturedRecipe.bind(
    null,
    date,
    slug,
  );

  return (
    <main className="flex flex-col items-center w-full h-full grow">
      <div className="flex flex-row grow w-full h-full">
        <div className="grow flex flex-col flex-nowrap items-center">
          {note && (
            <div className="w-full max-w-xl p-4 prose prose-invert max-w-none">
              <Markdown>{note}</Markdown>
            </div>
          )}
          <RecipeView recipe={recipe} slug={recipeSlug} />
        </div>
      </div>
      <hr className="w-full border-slate-700 print:hidden" />
      <div className="flex flex-row justify-center m-1 print:hidden gap-2">
        <form action={deleteFeaturedRecipeWithSlug}>
          <Button size="sm">Delete</Button>
        </form>
        <Link
          href={`/featured-recipes/${slug}/edit`}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Edit
        </Link>
        <Link
          href="/featured-recipes"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Back to Featured Recipes
        </Link>
      </div>
    </main>
  );
}
