import { notFound } from "next/navigation";
import {
  getFeaturedRecipeBySlug,
  getFeaturedRecipes,
} from "recipe-website-common/controller/data/readFeaturedRecipes";
import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import FeaturedRecipeDetailPage from "recipe-website-common/components/FeaturedRecipeDetailPage";

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
  const { recipe: recipeSlug, note } = featuredRecipe;

  let recipe;
  try {
    recipe = await getRecipeBySlug({ slug: recipeSlug });
  } catch {
    notFound();
  }

  return (
    <FeaturedRecipeDetailPage
      recipe={recipe}
      recipeSlug={recipeSlug}
      note={note}
    />
  );
}

export async function generateStaticParams() {
  const { featuredRecipes } = await getFeaturedRecipes();
  return featuredRecipes.map(({ slug }) => ({ slug }));
}
