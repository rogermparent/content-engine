"use client";

import { ReactNode } from "react";
import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { MassagedRecipeEntry } from "../../controller/data/read";
import { RecipeCardLink } from "../List/shared";

export function SearchResults() {
  const {
    query,
    searchedRecipes,
    allRecipes,
    status,
    error,
    mode,
    onRecipeSelect,
  } = useSearch();

  if (status === "error") {
    return <p>Error: {error?.message}</p>;
  }

  const recipeResults = query ? searchedRecipes : allRecipes;

  // Define how to wrap each item based on mode
  const renderItemWrapper = (
    recipe: MassagedRecipeEntry,
    content: ReactNode,
  ) => {
    if (mode === "modal" && onRecipeSelect) {
      return (
        <button
          type="button"
          onClick={() => onRecipeSelect(recipe)}
          className="text-left w-full h-full block"
        >
          {content}
        </button>
      );
    }
    return <RecipeCardLink href={`/recipe/${recipe.slug}`}>{content}</RecipeCardLink>;
  };

  return (
    <>
      {query && <p>Querying by: {query}</p>}
      {recipeResults && (
        <SearchList
          recipeResults={recipeResults}
          query={query}
          renderItemWrapper={renderItemWrapper}
        />
      )}
    </>
  );
}
