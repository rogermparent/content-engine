import Link from "next/link";
import { RecipeView } from "recipe-website-common/components/View";
import { buttonVariants } from "component-library/components/ui/button";
import Markdown from "component-library/components/Markdown";
import { Recipe } from "recipe-website-common/controller/types";
import { ReactNode } from "react";
import {
  PageMain,
  PageSection,
  PageActions,
} from "recipe-website-common/components/PageLayout";

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
    <PageMain>
      {note && (
        <PageSection maxWidth="xl" className="py-4">
          <div className="prose prose-invert max-w-none">
            <Markdown>{note}</Markdown>
          </div>
        </PageSection>
      )}
      <PageSection maxWidth="none" className="py-0" grow>
        <RecipeView recipe={recipe} slug={recipeSlug} />
      </PageSection>
      <PageActions>
        {actions}
        <Link
          href="/featured-recipes"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          Back to Featured Recipes
        </Link>
      </PageActions>
    </PageMain>
  );
}
