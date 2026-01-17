"use client";

import { SearchProvider } from "./SearchContext";
import { useSearchURLSync } from "./useSearchURLSync";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { SearchPagination } from "./SearchPagination";

function SearchPageContent() {
  useSearchURLSync(true); // Enable URL sync

  return (
    <>
      <SearchInput />
      <SearchResults />
      <SearchPagination />
    </>
  );
}

export function SearchPageWrapper() {
  return (
    <SearchProvider config={{ mode: "page" }}>
      <SearchPageContent />
    </SearchProvider>
  );
}
