"use client";

import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { RecipeCardLink } from "../List/shared";

export function SearchResultsPage() {
  const { query, searchedRecipes, status, error } = useSearch();

  if (status === "error") {
    return <p>Error: {error?.message}</p>;
  }

  return (
    <>
      {query && <p>Querying by: {query}</p>}
      {searchedRecipes && (
        <SearchList
          recipeResults={searchedRecipes}
          query={query}
          renderItemWrapper={(recipe, content) => (
            <RecipeCardLink href={`/recipe/${recipe.slug}`}>
              {content}
            </RecipeCardLink>
          )}
        />
      )}
    </>
  );
}
