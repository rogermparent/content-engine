"use client";

import { useState } from "react";
import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { RecipeCardLink } from "../List/shared";
import { EmptyState } from "../EmptyState";
import { SearchSkeleton } from "./SearchSkeleton";
import { TagFilterRail } from "./TagFilterRail";
import { Button } from "@discontent/component-library/components/ui/button";
import { RecipeSort, RecipeSortControl, useSortedRecipes } from "../RecipeSort";

export function SearchResultsPage() {
  const {
    query,
    selectedTags,
    displayedRecipes,
    isSearching,
    status,
    error,
    retry,
  } = useSearch();
  const [sort, setSort] = useState<RecipeSort>("relevance");
  const sortedRecipes = useSortedRecipes(displayedRecipes, sort);

  if (status === "error") {
    return (
      <EmptyState
        title="Search is unavailable"
        message={error?.message || "Something went wrong loading recipes."}
        action={
          <Button type="button" onClick={retry}>
            Try again
          </Button>
        }
      />
    );
  }

  const hasFilter = !!query || selectedTags.length > 0;

  // Results body. The tag rail is always rendered above it (below), so tags can
  // be browsed even before a query is entered.
  let body;
  if (!hasFilter) {
    body = (
      <p className="text-center my-8 text-muted-foreground">
        Enter a search above, or pick a tag, to find recipes.
      </p>
    );
  } else if (query && isSearching) {
    body = <SearchSkeleton />;
  } else if (!sortedRecipes || sortedRecipes.length === 0) {
    body = <EmptyState message="No recipes match your search." />;
  } else {
    body = (
      <>
        <div className="my-2 flex flex-row flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {sortedRecipes.length}{" "}
            {sortedRecipes.length === 1 ? "result" : "results"}
          </p>
          <RecipeSortControl value={sort} onChange={setSort} />
        </div>
        <SearchList
          recipeResults={sortedRecipes}
          query={query}
          renderItemWrapper={(recipe, content) => (
            <RecipeCardLink href={`/recipe/${recipe.slug}`}>
              {content}
            </RecipeCardLink>
          )}
        />
      </>
    );
  }

  return (
    <>
      <TagFilterRail />
      {body}
    </>
  );
}
