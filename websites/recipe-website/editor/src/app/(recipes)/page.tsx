import Link from "next/link";
import RecipeList from "recipe-website-common/components/List";
import { getRecipes } from "recipe-website-common/controller/data/read";

export default async function Home() {
  const { recipes, more } = await getRecipes({ limit: 6 });
  return (
    <main className="flex flex-col items-center h-full w-full p-2 max-w-prose lg:max-w-4xl mx-auto grow bg-slate-950">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl">Latest Recipes</h2>
        {recipes && recipes.length > 0 ? (
          <div>
            <RecipeList recipes={recipes} />
            <div className="flex flex-row items-center justify-center">
              {more && (
                <Link
                  href="/recipes"
                  className="font-semibold text-center p-1 m-1 bg-slate-700 rounded-xs"
                >
                  More
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
