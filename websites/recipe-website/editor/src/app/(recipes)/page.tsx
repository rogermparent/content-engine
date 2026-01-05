import Link from "next/link";
import RecipeList from "recipe-website-common/components/List";
import {
  getRecipes,
  MassagedRecipeEntry,
} from "recipe-website-common/controller/data/read";
import { getFeaturedRecipes } from "recipe-website-common/controller/data/readFeaturedRecipes";

function RecipeSection({
  title,
  recipes,
  linkHref,
  linkText,
}: {
  title: string;
  recipes: MassagedRecipeEntry[];
  linkHref?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="font-bold text-2xl my-4">{title}</h2>
      {recipes.length > 0 ? (
        <RecipeList recipes={recipes} />
      ) : (
        <p className="text-center my-4">There are no recipes yet.</p>
      )}
      {recipes.length > 0 && linkHref && linkText && (
        <div className="flex flex-row items-center justify-center my-4">
          <Link
            href={linkHref}
            className="font-semibold text-center p-1 m-1 bg-slate-700 rounded-xs"
          >
            {linkText}
          </Link>
        </div>
      )}
    </div>
  );
}

export default async function Home() {
  const { recipes, more } = await getRecipes({ limit: 6 });
  const { featuredRecipes } = await getFeaturedRecipes({ limit: 6 });

  const featuredAsRecipes: MassagedRecipeEntry[] = featuredRecipes
    .filter((f) => f.recipeName)
    .map((f) => ({
      slug: f.recipe,
      date: f.date,
      name: f.recipeName!,
      image: f.recipeImage,
    }));

  return (
    <main className="flex flex-col items-center h-full w-full px-4 py-6 max-w-4xl mx-auto grow bg-slate-950">
      <RecipeSection
        title="Featured Recipes"
        recipes={featuredAsRecipes}
        linkHref="/featured-recipes"
        linkText="View All Featured Recipes"
      />
      <RecipeSection
        title="Latest Recipes"
        recipes={recipes}
        linkHref={more ? "/recipes" : undefined}
        linkText="More"
      />
    </main>
  );
}
