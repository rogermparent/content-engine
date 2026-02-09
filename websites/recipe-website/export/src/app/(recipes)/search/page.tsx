import { Suspense } from "react";
import { SearchPageWrapper } from "recipe-website-common/components/SearchForm/SearchPageWrapper";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";

export default function Search() {
  return (
    <PageMain>
      <PageSection grow>
        <Suspense fallback={<div>Loading...</div>}>
          <SearchPageWrapper />
        </Suspense>
      </PageSection>
    </PageMain>
  );
}
