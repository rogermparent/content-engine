import Link from "next/link";
import { RecipeView } from "recipe-website-common/components/View";
import { buttonVariants } from "component-library/components/ui/button";
import Markdown from "component-library/components/Markdown";
import { Recipe } from "recipe-website-common/controller/types";
import { ReactNode } from "react";

export interface FeaturedRecipeDetailPageProps {
  recipe: Recipe;
  recipeSlug: string;
  note?: string;
  actions?: ReactNode;
}

export default function FeaturedRecipeDetailPage({
  recipe,
  recipeSlug,
  note,
  actions,
}: FeaturedRecipeDetailPageProps) {
  return (
    <main className="flex flex-col items-center w-full h-full grow">
      <div className="flex flex-row grow w-full h-full">
        <div className="grow flex flex-col flex-nowrap items-center">
          {note && (
            <div className="w-full max-w-xl p-4 prose prose-invert max-w-none">
              <Markdown>{note}</Markdown>
            </div>
          )}
          <RecipeView recipe={recipe} slug={recipeSlug} />
        </div>
      </div>
      <hr className="w-full border-slate-700 print:hidden" />
      <div className="flex flex-row justify-center m-1 print:hidden gap-2">
        {actions}
        <Link
          href="/featured-recipes"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Back to Featured Recipes
        </Link>
      </div>
    </main>
  );
}
