import { getFeaturedRecipes } from "recipe-website-common/controller/data/readFeaturedRecipes";
import FeaturedRecipeList from "recipe-website-common/components/List/FeaturedRecipe";
import Link from "next/link";

export default async function FeaturedRecipes() {
  const { featuredRecipes } = await getFeaturedRecipes({ limit: 10 });

  return (
    <main className="flex flex-col items-center w-full p-2 max-w-4xl mx-auto grow">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl">Featured Recipes</h2>
        {featuredRecipes && featuredRecipes.length > 0 ? (
          <div>
            <FeaturedRecipeList
              featuredRecipes={featuredRecipes}
              showNote={true}
              showViewFeatureLink={true}
            />
            <div className="flex flex-row items-center justify-center font-semibold">
              <Link
                href="/"
                className="text-center p-1 m-1 bg-slate-700 rounded-xs"
              >
                Home
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-center my-4">There are no featured recipes yet.</p>
        )}
      </div>
    </main>
  );
}
