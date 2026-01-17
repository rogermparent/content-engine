"use client";

import { Button } from "component-library/components/Button";
import { useSearch } from "./SearchContext";

export function SearchPagination() {
  const { hasNextPage, isFetchingNextPage, isFetching, loadMore } = useSearch();

  return (
    <div>
      <Button onClick={loadMore} disabled={!hasNextPage || isFetchingNextPage}>
        {isFetchingNextPage
          ? "Loading more..."
          : hasNextPage
            ? "Load More"
            : "Nothing more to load"}
      </Button>
      <span className="ml-2">
        {isFetching && !isFetchingNextPage ? "Fetching..." : null}
      </span>
    </div>
  );
}
