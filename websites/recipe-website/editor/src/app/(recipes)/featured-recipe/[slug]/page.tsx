import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import { deleteFeaturedRecipe } from "../../../../../controller/actions/featuredRecipes";
import { Button, buttonVariants } from "component-library/components/ui/button";
import FeaturedRecipeDetailPage from "recipe-website-common/components/FeaturedRecipeDetailPage";

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
    <FeaturedRecipeDetailPage
      recipe={recipe}
      recipeSlug={recipeSlug}
      note={note}
      actions={
        <>
          <form action={deleteFeaturedRecipeWithSlug}>
            <Button size="sm">Delete</Button>
          </form>
          <Link
            href={`/featured-recipe/${slug}/edit`}
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Edit
          </Link>
        </>
      }
    />
  );
}
