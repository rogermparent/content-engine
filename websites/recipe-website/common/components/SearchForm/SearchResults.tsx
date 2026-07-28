"use client";

import { useState } from "react";
import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { RecipeCardLink } from "../List/shared";
import { EmptyState } from "../EmptyState";
import { SearchSkeleton } from "./SearchSkeleton";
import { TagFilterRail } from "./TagFilterRail";
import { RecentSearches } from "./RecentSearches";
import { SearchTicker } from "./SearchTicker";
import { Button } from "@discontent/component-library/components/ui/button";
import { RecipeSort, RecipeSortControl, useSortedRecipes } from "../RecipeSort";

/** Cards rendered before the reveal control appears, and per "Show more" press. */
const REVEAL_STEP = 60;

export function SearchResultsPage() {
  const {
    query,
    selectedTags,
    filterMode,
    displayedRecipes,
    isSearching,
    status,
    error,
    retry,
    submitSearch,
    clearTags,
    recordSearch,
  } = useSearch();
  const [sort, setSort] = useState<RecipeSort>("relevance");
  const sortedRecipes = useSortedRecipes(displayedRecipes, sort);

  // Progressive reveal. The whole corpus is already in memory (the client
  // downloaded it via /search/all) and images lazy-load, so this is a DOM-node
  // and scroll-length cap, not a data cap — which is why it's local state and
  // not a URL page number that would fight the URL sync's replaceState.
  const [visibleCount, setVisibleCount] = useState(REVEAL_STEP);

  // Reset the cap when the inputs that define the result set change. Derived
  // during render off a "last inputs" key rather than in an effect, because
  // eslint-plugin-react-hooks@7's `set-state-in-effect` rule forbids setState in
  // effect bodies (same pattern as the palette's selection snap).
  const inputsKey = `${query}|${selectedTags.join(",")}|${filterMode}|${sort}`;
  const [lastInputsKey, setLastInputsKey] = useState(inputsKey);
  if (inputsKey !== lastInputsKey) {
    setLastInputsKey(inputsKey);
    setVisibleCount(REVEAL_STEP);
  }

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
  const total = sortedRecipes?.length;
  const visibleRecipes = sortedRecipes?.slice(0, visibleCount);
  const remaining = total === undefined ? 0 : total - visibleCount;

  let body;
  if (query && isSearching) {
    body = <SearchSkeleton />;
  } else if (!sortedRecipes || sortedRecipes.length === 0) {
    body = hasFilter ? (
      <EmptyState
        title="No matches"
        message="Nothing matched. Try a different term or loosen the tag filters."
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              submitSearch("");
              clearTags();
            }}
          >
            Clear search
          </Button>
        }
      />
    ) : null;
  } else {
    body = (
      <>
        <SearchList
          recipeResults={visibleRecipes}
          query={query}
          renderItemWrapper={(recipe, content) => (
            <RecipeCardLink
              href={`/recipe/${recipe.slug}`}
              // Opening a result is a commit: the query clearly worked, so it
              // earns its place in RECENT (typing alone never does).
              onClick={() => recordSearch(query)}
            >
              {content}
            </RecipeCardLink>
          )}
        />
        {remaining > 0 && (
          <div className="my-6 flex justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setVisibleCount(
                  (count) => count + Math.min(REVEAL_STEP, remaining),
                )
              }
            >
              Show {Math.min(REVEAL_STEP, remaining)} more
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="my-2 flex flex-row flex-wrap items-center justify-between gap-2">
        <SearchTicker
          count={total}
          query={query}
          selectedTagCount={selectedTags.length}
          isSearching={!!query && isSearching}
        />
        <RecipeSortControl value={sort} onChange={setSort} />
      </div>
      {/* Idle: recents + the tag rail are the browse affordance. */}
      {!hasFilter && <RecentSearches />}
      <TagFilterRail />
      {body}
    </>
  );
}
