"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { useInfiniteQuery, QueryStatus } from "@tanstack/react-query";
import { Document } from "flexsearch";
import {
  MassagedRecipeEntry,
  ReadRecipeIndexResult,
} from "../../controller/data/read";
import { useFlexSearch } from "./useFlexSearch";

const searchOptions = {
  merge: true,
  enrich: true,
};

async function fetchRecipes({
  pageParam,
}: {
  pageParam: number;
}): Promise<ReadRecipeIndexResult> {
  const res = await fetch("/search/page/" + pageParam);
  const json = (await res.json()) as ReadRecipeIndexResult;
  return json;
}

export interface SearchContextValue {
  // State
  query: string;
  inputValue: string | undefined;
  searchedRecipes: MassagedRecipeEntry[] | undefined;
  allRecipes: MassagedRecipeEntry[];
  seeking: number | undefined;

  // Query state (from TanStack Query)
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  status: QueryStatus;
  error: Error | null;

  // Config
  mode: "page" | "modal";
  onRecipeSelect?: (recipe: MassagedRecipeEntry) => void;

  // Actions
  setInputValue: (value: string) => void;
  submitSearch: (query: string) => void;
  loadMore: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export interface SearchConfig {
  mode: "page" | "modal";
  onRecipeSelect?: (recipe: MassagedRecipeEntry) => void;
}

export interface SearchProviderProps {
  config: SearchConfig;
  children: ReactNode;
}

export function SearchProvider({ config, children }: SearchProviderProps) {
  // FlexSearch index
  const [index] = useState<Document>(() => {
    return new Document({
      preset: "default",
      tokenize: "forward",
      document: { store: true, id: "slug", index: ["name", "ingredients"] },
    });
  });

  // Search state
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [seeking, setSeeking] = useState<number | undefined>();

  // TanStack Query for infinite pagination - NO initialData
  const infiniteQuery = useInfiniteQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage.more) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      if (firstPageParam <= 1) {
        return undefined;
      }
      return firstPageParam - 1;
    },
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = infiniteQuery;

  // Flatten all recipes from pages
  const allRecipes = useMemo(
    () => (data?.pages || []).flatMap(({ recipes }) => recipes),
    [data?.pages],
  );

  // Update FlexSearch index when recipes change
  useEffect(() => {
    if (index && allRecipes) {
      for (const recipe of allRecipes) {
        index.update(recipe);
      }
    }
  }, [index, allRecipes]);

  // FlexSearch integration
  const searchResults = useFlexSearch(query, index, allRecipes, searchOptions);

  const searchedRecipes = useMemo(() => {
    if (searchResults && "map" in searchResults) {
      return (searchResults as unknown as { doc: MassagedRecipeEntry }[]).map(
        ({ doc }) => doc,
      );
    }
  }, [searchResults]);

  // Handle seeking (load more when searching)
  useEffect(() => {
    if (
      seeking !== undefined &&
      searchedRecipes &&
      searchedRecipes.length <= seeking
    ) {
      fetchNextPage();
    } else {
      setSeeking(undefined);
    }
  }, [seeking, searchedRecipes, fetchNextPage]);

  // Context value
  const value: SearchContextValue = {
    query,
    inputValue,
    searchedRecipes,
    allRecipes,
    seeking,
    hasNextPage: hasNextPage || false,
    isFetching,
    isFetchingNextPage,
    status,
    error: error as Error | null,
    mode: config.mode,
    onRecipeSelect: config.onRecipeSelect,
    setInputValue,
    submitSearch: (newQuery: string) => {
      console.log("submitting", { newQuery });
      setQuery(newQuery);
      setInputValue(newQuery);
      setSeeking(searchedRecipes?.length || 0);
    },
    loadMore: () => setSeeking(allRecipes.length),
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
