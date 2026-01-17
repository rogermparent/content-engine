import { SearchPageWrapper } from "recipe-website-common/components/SearchForm/SearchPageWrapper";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";

export default function Search() {
  return (
    <PageMain>
      <PageSection grow>
        <SearchPageWrapper />
      </PageSection>
    </PageMain>
  );
}
