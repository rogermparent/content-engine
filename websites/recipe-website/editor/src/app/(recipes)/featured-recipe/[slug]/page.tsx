import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import { recipeItems } from "recipe-website-common/controller/data/readRecipeItem";
import { deleteFeaturedRecipe } from "../../../../../controller/actions/featuredRecipes";
import { Button } from "@discontent/component-library/components/ui/button";
import FeaturedRecipeDetailPage from "recipe-website-common/components/FeaturedRecipeDetailPage";
import { ConfirmDeleteButton } from "@discontent/component-library/components/ConfirmDelete";

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
  /*
   * A dangling reference has always been possible here — the recipe can be
   * deleted while the feature remains — so `null` was already the answer. The
   * cached read hands it back as a value instead of as a swallowed exception.
   */
  const recipe = await recipeItems.read(featuredRecipe.recipe);
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

  /*
   * The whole recipe record, rendered under the *featured recipe's* slug. This
   * is the surface that proves the item tag has to be keyed by item rather than
   * by path: this URL is a function of the feature's slug, and nothing the
   * recipe write knows could name it (§2, F19).
   */
  const recipe = await recipeItems.read(recipeSlug);
  if (!recipe) notFound();

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
          <form
            id="delete-featured-recipe-form"
            action={deleteFeaturedRecipeWithSlug}
            className="contents"
          />
          <ConfirmDeleteButton
            formId="delete-featured-recipe-form"
            itemLabel="feature"
            title="Remove this feature?"
            description="The recipe itself is not deleted — only its place on the homepage."
          />
          <Button asChild size="sm">
            <Link href={`/featured-recipe/${slug}/edit`}>Edit</Link>
          </Button>
        </>
      }
    />
  );
}
