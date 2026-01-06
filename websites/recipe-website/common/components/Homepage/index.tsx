import Link from "next/link";
import RecipeList from "../List";
import { MassagedRecipeEntry } from "../../controller/data/read";

function RecipeSection({
  title,
  recipes,
  linkHref,
  linkText,
  emptyText,
}: {
  title: string;
  recipes: MassagedRecipeEntry[];
  linkHref?: string;
  linkText?: string;
  emptyText?: string;
}) {
  if (recipes.length === 0 && !emptyText) {
    return null;
  }

  return (
    <div className="my-4">
      <h2 className="font-bold text-2xl my-2">{title}</h2>
      {recipes.length > 0 ? (
        <RecipeList recipes={recipes} />
      ) : (
        <p className="text-center my-4">{emptyText}</p>
      )}
      {recipes.length > 0 && linkHref && linkText && (
        <div className="flex flex-row items-center justify-center my-2">
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

export default function Homepage({
  recipes,
  featuredRecipes,
  moreRecipes,
}: {
  recipes: MassagedRecipeEntry[];
  featuredRecipes: MassagedRecipeEntry[];
  moreRecipes: boolean;
}) {
  return (
    <main className="flex flex-col items-center h-full w-full px-4 py-6 max-w-4xl mx-auto grow bg-slate-950">
      <RecipeSection
        title="Featured Recipes"
        recipes={featuredRecipes}
        linkHref="/featured-recipes"
        linkText="More Featured Recipes"
      />
      <RecipeSection
        title="Latest Recipes"
        recipes={recipes}
        linkHref={moreRecipes ? "/recipes" : undefined}
        linkText="More Latest Recipes"
        emptyText="There are no recipes yet."
      />
    </main>
  );
}
