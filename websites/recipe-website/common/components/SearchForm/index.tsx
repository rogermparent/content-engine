"use client";

import {
  MassagedRecipeEntry,
  ReadRecipeIndexResult,
} from "../../controller/data/readIndex";
import { Button } from "component-library/components/Button";
import { TextInput } from "component-library/components/Form/inputs/Text";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import SearchList from "../SearchList";
import { useFlexSearch } from "./useFlexSearch";
import { Document } from "flexsearch";
const queryClient = new QueryClient();

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

function SearchFormQuery({ firstPage }: { firstPage: ReadRecipeIndexResult }) {
  const [index, setIndex] = useState<Document>();
  const [query, setQuery] = useState<string>();

  useEffect(() => {
    setIndex(
      new Document({
        preset: "default",
        tokenize: "forward",
        document: { store: true, id: "slug", index: ["name", "ingredients"] },
      }),
    );
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
        index.update(recipe);
      }
    }
  }, [index, allRecipes]);

  const searchResults = useFlexSearch(query, index, allRecipes, searchOptions);

  const searchedRecipes = useMemo(() => {
    if (searchResults && "map" in searchResults) {
      return (searchResults as unknown as { doc: MassagedRecipeEntry }[]).map(
        ({ doc }) => {
          return doc;
        },
      );
    }
  }, [searchResults]);

  const [seeking, setSeeking] = useState<number | undefined>();

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
  }, [seeking, searchedRecipes, setSeeking, data.pages, fetchNextPage]);

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
          setSeeking(searchedRecipes?.length || 0);
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
              onClick={() => {
                setSeeking(searchedRecipes?.length);
              }}
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
