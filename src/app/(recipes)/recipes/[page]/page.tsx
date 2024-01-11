import getRecipes from "@/app/lib/models/recipes/data/readIndex";
import RecipeList from "@/components/Recipe/List";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RECIPES_PER_PAGE } from "../constants";

export default async function Recipes({
  params: { page },
}: {
  params: { page: string };
}) {
  const pageNumber = Number(page);

  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new Error("Invalid page number");
  }
  if (pageNumber === 1) {
    redirect("/recipes");
  }

  const { recipes, more } = await getRecipes({
    offset: (pageNumber - 1) * RECIPES_PER_PAGE,
    limit: RECIPES_PER_PAGE,
  });

  return (
    <main className="flex flex-col items-center w-full p-2 max-w-4xl mx-auto grow">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl">All Recipes</h2>
        {recipes && recipes.length > 0 ? (
          <div>
            <RecipeList recipes={recipes} />
            <div className="flex flex-row items-center justify-center font-semibold">
              <Link
                href={`/recipes/${pageNumber === 2 ? "" : pageNumber - 1}`}
                className="text-center p-1 m-1 bg-slate-700 rounded-sm"
              >
                &larr;
              </Link>
              <span className="p-1 m-1">{pageNumber}</span>
              {more && (
                <Link
                  href={`/recipes/${pageNumber + 1}`}
                  className="text-center p-1 m-1 bg-slate-700 rounded-sm"
                >
                  &rarr;
                </Link>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center my-4">There are no recipes yet.</p>
        )}
      </div>
    </main>
  );
}
