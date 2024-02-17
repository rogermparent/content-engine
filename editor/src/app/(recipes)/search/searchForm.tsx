"use client";

import {
  MassagedRecipeEntry,
  ReadRecipeIndexResult,
} from "recipes-collection/controller/data/readIndex";
import { Button } from "component-library/Button";
import { TextInput } from "component-library/Form/inputs/Text";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchList from "./searchList";
import { useFlexSearch } from "./useFlexSearch";
import FlexSearch, { Id, Index } from "flexsearch";

const queryClient = new QueryClient();

async function fetchRecipes({
  pageParam,
}: {
  pageParam: number;
}): Promise<ReadRecipeIndexResult> {
  const res = await fetch("/search/page/" + pageParam);
  const json = (await res.json()) as ReadRecipeIndexResult;
  return json;
}

function SearchFormQuery({ firstPage }: { firstPage: ReadRecipeIndexResult }) {
  const [store, setStore] = useState<Map<Id, MassagedRecipeEntry>>();
  const [index, setIndex] = useState<Index>();
  const [query, setQuery] = useState<string>();

  useEffect(() => {
    setIndex(new FlexSearch.Index({ preset: "default", tokenize: "forward" }));
    setStore(new Map<Id, MassagedRecipeEntry>());
  }, []);

  const infiniteQuery = useInfiniteQuery({
    initialData: { pages: [firstPage], pageParams: [1] },
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

  const allRecipes = useMemo(
    () => data.pages.flatMap(({ recipes }) => recipes),
    [data.pages],
  );

  useEffect(() => {
    if (index && allRecipes) {
      for (const recipe of allRecipes) {
        index.update(
          recipe.slug,
          [recipe.name, recipe.ingredients?.join(" ")].join(" "),
        );
      }
    }
  }, [index, allRecipes]);

  useEffect(() => {
    if (store && allRecipes) {
      for (const recipe of allRecipes) {
        store.set(recipe.slug, recipe);
      }
    }
  }, [store, allRecipes]);

  const searchedRecipeIds = useFlexSearch(query, index, allRecipes);

  const searchedRecipes = useMemo(
    () =>
      store &&
      searchedRecipeIds?.map((id) => {
        const recipe = store.get(id);
        if (!recipe) {
          throw new Error("Recipe not found in store!");
        }
        return recipe;
      }),
    [store, searchedRecipeIds],
  );

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const elements = form.elements as typeof form.elements & {
            query: { value: string };
          };
          setQuery(elements.query.value || undefined);
        }}
      >
        <TextInput name="query" label="Query" />
        <Button type="submit">Submit</Button>
      </form>
      {query && <p>Querying by: {query}</p>}
      {status === "error" ? (
        <p>Error: {error.message}</p>
      ) : (
        <>
          {query && searchedRecipes && (
            <SearchList recipeResults={searchedRecipes} query={query} />
          )}
          <div>
            <Button
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
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
        </>
      )}
    </>
  );
}

export function SearchForm({
  firstPage,
}: {
  firstPage: ReadRecipeIndexResult;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchFormQuery firstPage={firstPage} />
    </QueryClientProvider>
  );
}
