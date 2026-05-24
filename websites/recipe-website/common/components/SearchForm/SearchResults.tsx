"use client";

import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { RecipeCardLink } from "../List/shared";
import { EmptyState } from "../EmptyState";
import { SearchSkeleton } from "./SearchSkeleton";
import { Button } from "@discontent/component-library/components/ui/button";

export function SearchResultsPage() {
  const { query, searchedRecipes, isSearching, status, error, retry } =
    useSearch();

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
      <p className="my-2 text-sm text-muted-foreground" aria-live="polite">
        {searchedRecipes.length}{" "}
        {searchedRecipes.length === 1 ? "result" : "results"} for &ldquo;
        {query}&rdquo;
      </p>
      <SearchList
        recipeResults={searchedRecipes}
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
