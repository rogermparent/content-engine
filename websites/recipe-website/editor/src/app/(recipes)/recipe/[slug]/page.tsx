import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import { RecipeView } from "recipe-website-common/components/View";
import { deleteRecipe } from "../../../../../controller/actions";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  PageMain,
  PageSection,
  PageActions,
} from "recipe-website-common/components/PageLayout";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let recipe;
  try {
    recipe = await getRecipeBySlug({ slug });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  return { title: recipe?.name || slug };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let recipe;
  try {
    recipe = await getRecipeBySlug({ slug });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const { date } = recipe;

  const deleteRecipeWithId = deleteRecipe.bind(null, date, slug);

  return (
    <PageMain>
      <PageSection maxWidth="none" className="py-0" grow>
        <RecipeView recipe={recipe} slug={slug} />
      </PageSection>
      <PageActions>
        <form action={deleteRecipeWithId} className="contents">
          <Button type="submit" size="sm" variant="destructive">
            Delete
          </Button>
        </form>
        <Button asChild size="sm">
          <Link href={`/recipe/${slug}/edit`}>Edit</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/recipe/${slug}/copy`}>Copy</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/featured-recipe/new?recipe=${slug}`}>Feature</Link>
        </Button>
      </PageActions>
    </PageMain>
  );
}
