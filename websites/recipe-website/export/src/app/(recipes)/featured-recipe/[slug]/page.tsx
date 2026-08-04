import { notFound } from "next/navigation";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import { readAllFeaturedRecipeIds } from "recipe-website-common/controller/data/readFeaturedRecipePages";
import { recipeItems } from "recipe-website-common/controller/data/readRecipeItem";
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
  const { recipe: recipeSlug, note } = featuredRecipe;

  /*
   * The whole recipe record, rendered under the *featured recipe's* slug. This
   * is the surface that proves the item tag has to be keyed by item rather than
   * by path: this URL is a function of the feature's slug, and nothing the
   * recipe write knows could name it (§2, F19).
   */
  const recipe = await recipeItems.read(recipeSlug);
  if (!recipe) notFound();

  return (
    <FeaturedRecipeDetailPage
      recipe={recipe}
      recipeSlug={recipeSlug}
      note={note}
    />
  );
}

/*
 * A keys-only walk of the sorted keyspace, not a read of the content index
 * (F7) — see `recipe/[slug]`. Unblocked here by D2b, which gave featured
 * recipes a keyspace of their own.
 */
export async function generateStaticParams() {
  const slugs = await readAllFeaturedRecipeIds();
  return slugs.map((slug) => ({ slug }));
}
