import type { PaginationPage } from "@discontent/cms/pagination/types";
import RecipeList from "../List";
import type { RecipeListEntry } from "../../controller/paginationConfigs";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { RecipePagination } from "../Pagination";
import { EmptyState } from "../EmptyState";

/**
 * One surface of the paginated recipe index — the landing, or one numbered
 * page. Both render identically apart from their navigation, so they share a
 * component and differ only in the page they are handed.
 */
export function RecipeIndexPageWrapper({
  page,
  isLanding,
}: {
  page: PaginationPage<RecipeListEntry>;
  isLanding: boolean;
}) {
  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>All Recipes</PageHeading>
        {page.items.length > 0 ? (
          <div>
            <RecipeList recipes={page.items} />
            <RecipePagination
              basePath="/recipes"
              page={page}
              isLanding={isLanding}
            />
          </div>
        ) : (
          <EmptyState message="There are no recipes yet." />
        )}
      </PageSection>
    </PageMain>
  );
}
