import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import getRecipeBySlug from "recipe-website-common/controller/data/read";
import { RecipeView } from "recipe-website-common/components/View";
import deleteRecipe from "@/actions/deleteRecipe";

export const dynamic = "force-dynamic";

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
    if ((e as { code: string }).code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  return { title: recipe?.name || slug };
}

export default async function RecipePage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  let recipe;
  try {
    recipe = await getCachedRecipeBySlug(slug);
  } catch (e) {
    if ((e as { code: string }).code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const { date } = recipe;

  const deleteRecipeWithId = deleteRecipe.bind(null, date, slug);

  return (
    <main className="flex flex-col items-center w-full h-full grow">
      <div className="flex flex-row grow w-full h-full">
        <div className="grow flex flex-col flex-nowrap items-center">
          <RecipeView recipe={recipe} slug={slug} />
        </div>
      </div>
      <hr className="w-full border-slate-700 print:hidden" />
      <div className="flex flex-row justify-center m-1 print:hidden">
        <form action={deleteRecipeWithId}>
          <button className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1">
            Delete
          </button>
        </form>
        <Link
          href={`/recipe/${slug}/edit`}
          className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1"
        >
          Edit
        </Link>
        <Link
          href={`/recipe/${slug}/copy`}
          className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1"
        >
          Copy
        </Link>
      </div>
    </main>
  );
}
