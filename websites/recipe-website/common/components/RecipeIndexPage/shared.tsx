import RecipeList from "../List";
import { MassagedRecipeEntry } from "../../controller/data/read";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { RecipePagination } from "../Pagination";
import { EmptyState } from "../EmptyState";

export function RecipeIndexPageWrapper({
  recipes,
  pageNumber,
  more,
}: {
  recipes: MassagedRecipeEntry[];
  pageNumber: number;
  more: boolean;
}) {
  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>All Recipes</PageHeading>
        {recipes && recipes.length > 0 ? (
          <div>
            <RecipeList recipes={recipes} />
            <RecipePagination
              basePath="/recipes"
              pageNumber={pageNumber}
              more={more}
            />
          </div>
        ) : (
          <EmptyState message="There are no recipes yet." />
        )}
      </PageSection>
    </PageMain>
  );
}
