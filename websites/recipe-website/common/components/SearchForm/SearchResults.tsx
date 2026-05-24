"use client";

import { useState } from "react";
import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { RecipeCardLink } from "../List/shared";
import { EmptyState } from "../EmptyState";
import { SearchSkeleton } from "./SearchSkeleton";
import { Button } from "@discontent/component-library/components/ui/button";
import { RecipeSort, RecipeSortControl, useSortedRecipes } from "../RecipeSort";

export function SearchResultsPage() {
  const { query, searchedRecipes, isSearching, status, error, retry } =
    useSearch();
  const [sort, setSort] = useState<RecipeSort>("relevance");
  const sortedRecipes = useSortedRecipes(searchedRecipes, sort);

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

  if (!query) {
    return (
      <p className="text-center my-8 text-muted-foreground">
        Enter a search above to find recipes by name or ingredient.
      </p>
    );
  }

  if (isSearching) {
    return <SearchSkeleton />;
  }

  if (!searchedRecipes || searchedRecipes.length === 0) {
    return <EmptyState message={`No recipes match “${query}”.`} />;
  }

  return (
    <>
      <div className="my-2 flex flex-row flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {searchedRecipes.length}{" "}
          {searchedRecipes.length === 1 ? "result" : "results"} for &ldquo;
          {query}&rdquo;
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
