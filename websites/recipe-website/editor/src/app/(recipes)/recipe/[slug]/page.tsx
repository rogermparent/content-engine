import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import { RecipeView } from "recipe-website-common/components/View";
import { deleteRecipe } from "../../../../../controller/actions";
import { Button, buttonVariants } from "component-library/components/ui/button";

export const dynamic = "force-dynamic";

const getCachedRecipeBySlug = cache(getRecipeBySlug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let recipe;
  try {
    recipe = await getCachedRecipeBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
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
      <div className="flex flex-row justify-center m-1 print:hidden gap-2">
        <form action={deleteRecipeWithId}>
          <Button size="sm">Delete</Button>
        </form>
        <Link
          href={`/recipe/${slug}/edit`}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Edit
        </Link>
        <Link
          href={`/recipe/${slug}/copy`}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Copy
        </Link>
      </div>
    </main>
  );
}
