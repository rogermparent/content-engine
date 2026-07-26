import Link from "next/link";
import RecipeList from "../List";
import {
  MassagedRecipeEntry,
  getAllTags,
  getRecipeBySlug,
} from "../../controller/data/read";
import { Recipe } from "../../controller/types";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { Button } from "@discontent/component-library/components/ui/button";
import { EmptyState } from "recipe-website-common/components/EmptyState";
import { HeroBench } from "./HeroBench";
import { BrowseChips } from "./BrowseChips";

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
    <div className="mb-8">
      <PageHeading className="font-display">{title}</PageHeading>
      {recipes.length > 0 ? (
        <RecipeList recipes={recipes} />
      ) : (
        emptyText && <EmptyState message={emptyText} />
      )}
      {recipes.length > 0 && linkHref && linkText && (
        <div className="flex flex-row items-center justify-center my-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={linkHref}>{linkText}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default async function Homepage({
  recipes,
  featuredRecipes,
  moreRecipes,
}: {
  recipes: MassagedRecipeEntry[];
  featuredRecipes: MassagedRecipeEntry[];
  moreRecipes: boolean;
}) {
  // The hero leads with a featured recipe when there is one; otherwise it falls
  // back to the latest recipe. The grids below still list every recipe.
  const heroSlug = featuredRecipes[0]?.slug ?? recipes[0]?.slug;
  const heroLabel: "Featured" | "Latest" =
    featuredRecipes.length > 0 ? "Featured" : "Latest";

  const [tags, heroRecipe] = await Promise.all([
    getAllTags(),
    heroSlug
      ? getRecipeBySlug({ slug: heroSlug }).catch(() => undefined)
      : Promise.resolve<Recipe | undefined>(undefined),
  ]);

  return (
    <PageMain>
      <PageSection>
        {heroRecipe && heroSlug && (
          <HeroBench recipe={heroRecipe} slug={heroSlug} label={heroLabel} />
        )}
        <BrowseChips tags={tags} />
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
