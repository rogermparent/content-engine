import { notFound } from "next/navigation";
import { recipeItems } from "recipe-website-common/controller/data/readRecipeItem";
import { RecipeView } from "recipe-website-common/components/View";
import { getRecipes } from "recipe-website-common/controller/data/read";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await recipeItems.read(slug);
  if (!recipe) notFound();
  return { title: recipe?.name || slug };
}

export default async function Recipe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await recipeItems.read(slug);
  if (!recipe) notFound();

  return (
    <PageMain>
      <PageSection maxWidth="none" className="py-0" grow>
        <RecipeView recipe={recipe} slug={slug} />
      </PageSection>
    </PageMain>
  );
}

export async function generateStaticParams() {
  const { recipes } = await getRecipes();
  return recipes.map(({ slug }) => ({ slug }));
}
