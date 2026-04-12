"use client";

import { useSearchURLSync } from "./useSearchURLSync";
import { SearchInput } from "./SearchInput";
import { SearchResultsPage } from "./SearchResults";

export function SearchPageWrapper() {
  useSearchURLSync(true); // Enable URL sync for page mode

  return (
    <>
      <SearchInput />
      <SearchResultsPage />
    </>
  );
}
