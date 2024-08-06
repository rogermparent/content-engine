import { cache } from "react";
import { notFound } from "next/navigation";
import getRecipeBySlug from "recipe-website-common/controller/data/read";
import { RecipeView } from "recipe-website-common/components/View";
import getRecipes from "recipe-website-common/controller/data/readIndex";

const getCachedRecipeBySlug = cache(getRecipeBySlug);

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}) {
  let recipe;
  try {
    recipe = await getCachedRecipeBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  return { title: recipe?.name || slug };
}

export default async function Recipe({
  params: { slug },
}: {
  params: { slug: string };
}) {
  let recipe;
  try {
    recipe = await getRecipeBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }

  return (
    <main className="flex flex-col items-center w-full h-full grow">
      <div className="flex flex-row grow w-full h-full">
        <div className="grow flex flex-col flex-nowrap items-center">
          <RecipeView recipe={recipe} slug={slug} />
        </div>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  const { recipes } = await getRecipes();
  return recipes.map(({ slug }) => ({ slug }));
}
