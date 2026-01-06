import Link from "next/link";
import RecipeList from "../List";
import { MassagedRecipeEntry } from "../../controller/data/read";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

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
    <div className="mb-4">
      <PageHeading>{title}</PageHeading>
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
    <PageMain>
      <PageSection>
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
      </PageSection>
    </PageMain>
  );
}
