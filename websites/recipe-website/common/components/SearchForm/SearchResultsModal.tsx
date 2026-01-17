"use client";

import { useSearch } from "./SearchContext";
import SearchList from "../SearchList";
import { MassagedRecipeEntry } from "../../controller/data/read";

interface SearchResultsModalProps {
  onRecipeSelect: (recipe: MassagedRecipeEntry) => void;
}

export function SearchResultsModal({ onRecipeSelect }: SearchResultsModalProps) {
  const {
    query,
    searchedRecipes,
    allRecipes,
    status,
    error,
  } = useSearch();

  if (status === "error") {
    return <p>Error: {error?.message}</p>;
  }

  const recipeResults = query ? searchedRecipes : allRecipes;

  return (
    <>
      {query && <p>Querying by: {query}</p>}
      {recipeResults && (
        <SearchList
          recipeResults={recipeResults}
          query={query}
          renderItemWrapper={(recipe, content) => (
            <button
              type="button"
              onClick={() => onRecipeSelect(recipe)}
              className="text-left w-full h-full block"
            >
              {content}
            </button>
          )}
        />
      )}
    </>
  );
}
