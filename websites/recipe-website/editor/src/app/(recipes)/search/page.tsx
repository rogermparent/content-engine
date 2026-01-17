import { Suspense } from "react";
import { getRecipes } from "recipe-website-common/controller/data/read";
import { RECIPES_PER_SEARCH_PAGE } from "recipe-website-common/components/SearchForm/constants";
import SearchForm from "recipe-website-common/components/SearchForm";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";

export default async function Search() {
  const firstPage = await getRecipes({
    limit: RECIPES_PER_SEARCH_PAGE,
  });
  return (
    <PageMain>
      <PageSection grow>
        <Suspense fallback={<div>Loading search...</div>}>
          <SearchForm firstPage={firstPage} isModal={false} />
        </Suspense>
      </PageSection>
    </PageMain>
  );
}
