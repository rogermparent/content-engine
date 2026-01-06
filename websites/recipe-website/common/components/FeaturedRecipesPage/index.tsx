import FeaturedRecipeList from "recipe-website-common/components/List/FeaturedRecipe";
import Link from "next/link";
import { MassagedFeaturedRecipeEntry } from "recipe-website-common/controller/data/readFeaturedRecipes";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

export interface FeaturedRecipesPageProps {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
}

export default function FeaturedRecipesPage({
  featuredRecipes,
}: FeaturedRecipesPageProps) {
  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>Featured Recipes</PageHeading>
        {featuredRecipes && featuredRecipes.length > 0 ? (
          <div>
            <FeaturedRecipeList featuredRecipes={featuredRecipes} />
            <div className="flex flex-row items-center justify-center font-semibold my-2">
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
      </PageSection>
    </PageMain>
  );
}
