import getRecipes from "recipe-website-common/controller/data/readIndex";
import RecipeList from "recipe-website-common/components/List";
import Link from "next/link";
import { RECIPES_PER_PAGE } from "./constants";

export default async function Recipes() {
  const { recipes, more } = await getRecipes({ limit: RECIPES_PER_PAGE });

  return (
    <main className="flex flex-col items-center w-full p-2 max-w-4xl mx-auto grow">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl">All Recipes</h2>
        {recipes && recipes.length > 0 ? (
          <div>
            <RecipeList recipes={recipes} />
            <div className="flex flex-row items-center justify-center font-semibold">
              <Link
                href="/"
                className="text-center p-1 m-1 bg-slate-700 rounded-sm"
              >
                Home
              </Link>
              <span className="p-1 m-1">1</span>
              {more && (
                <Link
                  href="/recipes/2"
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
