import Link from "next/link";
import FeaturedRecipeList from "../List/FeaturedRecipe";
import { MassagedFeaturedRecipeEntry } from "../../controller/data/readFeaturedRecipes";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { Button } from "@discontent/component-library/components/ui/button";
import { RecipePagination } from "../Pagination";
import { EmptyState } from "../EmptyState";

export function FeaturedRecipeIndexPageWrapper({
  featuredRecipes,
  pageNumber,
  more,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
  pageNumber: number;
  more: boolean;
}) {
  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>Featured Recipes</PageHeading>
        {featuredRecipes && featuredRecipes.length > 0 ? (
          <div>
            <FeaturedRecipeList featuredRecipes={featuredRecipes} />
            <RecipePagination
              basePath="/featured-recipes"
              pageNumber={pageNumber}
              more={more}
            />
          </div>
        ) : (
          <EmptyState
            title="No featured recipes yet"
            message="Feature a recipe to spotlight it here."
            action={
              <Button asChild>
                <Link href="/recipes/1">Browse all recipes</Link>
              </Button>
            }
          />
        )}
      </PageSection>
    </PageMain>
  );
}
