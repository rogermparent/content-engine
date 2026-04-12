"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Document } from "flexsearch";
import IdxDB from "flexsearch/db/indexeddb";
import { MassagedRecipeEntry } from "../../controller/data/read";

// --- sessionStorage-backed state via useSyncExternalStore ---

const SESSION_EVENT = "recipe-search-storage";
const QUERY_KEY = "search-query";
const INPUT_KEY = "search-inputValue";

function subscribeSession(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  return () => window.removeEventListener(SESSION_EVENT, callback);
}

function readSession(key: string) {
  return sessionStorage.getItem(key) ?? "";
}

function writeSession(key: string, value: string) {
  if (value) {
    sessionStorage.setItem(key, value);
  } else {
    sessionStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

const getQuerySnapshot = () => readSession(QUERY_KEY);
const getInputSnapshot = () => readSession(INPUT_KEY);
const getServerSnapshot = () => "";

// --- localStorage-backed last-populated index version ---
// Lives in localStorage (not sessionStorage) so it persists alongside the
// IndexedDB-cached FlexSearch index across sessions.

const LOCAL_EVENT = "recipe-search-local";
const POPULATED_VERSION_KEY = "search-populated-version";

function subscribeLocal(callback: () => void) {
  window.addEventListener(LOCAL_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LOCAL_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getPopulatedVersion() {
  return localStorage.getItem(POPULATED_VERSION_KEY);
}

function writePopulatedVersion(version: string) {
  localStorage.setItem(POPULATED_VERSION_KEY, version);
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

const getPopulatedVersionServerSnapshot = () => null;

// --- data fetchers ---

async function fetchAllRecipes(): Promise<MassagedRecipeEntry[]> {
  const res = await fetch("/search/all");
  return res.json();
}

async function fetchIndexVersion(): Promise<string> {
  const res = await fetch("/search/version");
  const { version } = (await res.json()) as { version: string };
  return version;
}

// --- context ---

export interface SearchContextValue {
  query: string;
  inputValue: string | undefined;
  searchedRecipes: MassagedRecipeEntry[] | undefined;
  allRecipes: MassagedRecipeEntry[];
  indexReady: boolean;
  isFetching: boolean;
  status: "pending" | "success" | "error";
  error: Error | null;
  setInputValue: (value: string) => void;
  submitSearch: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  // Stable Document instance
  const [index] = useState<Document>(
    () =>
      new Document({
        preset: "default",
        tokenize: "forward",
        document: { store: true, id: "slug", index: ["name", "ingredients"] },
      }),
  );

  // Step 1: mount IndexedDB persistent storage
  const { data: mountedIndex } = useQuery({
    queryKey: ["search-index-mount"],
    queryFn: async () => {
      await index.mount(new IdxDB("recipe-search"));
      return index;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const indexReady = !!mountedIndex;

  // Step 2: check the current server-side index version. Cheap stat-based
  // endpoint; always revalidated so a fresh page load sees fresh data.
  const { data: serverVersion } = useQuery({
    queryKey: ["search-index-version"],
    queryFn: fetchIndexVersion,
    staleTime: 0,
    gcTime: Infinity,
  });

  // Last version we successfully populated into the IndexedDB-cached index.
  const populatedVersion = useSyncExternalStore(
    subscribeLocal,
    getPopulatedVersion,
    getPopulatedVersionServerSnapshot,
  );

  // If the server version matches what we last populated, the
  // IndexedDB-cached FlexSearch index is already current — skip the
  // recipes fetch and the populate step entirely.
  const needsRefetch =
    serverVersion !== undefined && serverVersion !== populatedVersion;

  // Step 3: fetch all recipes (only when the cached index is stale)
  const recipesQuery = useQuery({
    queryKey: ["recipes"],
    queryFn: fetchAllRecipes,
    enabled: needsRefetch,
  });
  const allRecipes = useMemo(
    () => recipesQuery.data ?? [],
    [recipesQuery.data],
  );

  // Step 4: populate the index with fresh recipes, then commit.
  // Keyed on dataUpdatedAt so it only re-runs on an actual refetch.
  // After commit, record the populated version so future loads with an
  // unchanged server version can skip the fetch entirely.
  useQuery({
    queryKey: ["search-index-populate", recipesQuery.dataUpdatedAt],
    queryFn: async () => {
      for (const recipe of allRecipes) {
        mountedIndex!.update(recipe);
      }
      await mountedIndex!.commit();
      if (serverVersion) writePopulatedVersion(serverVersion);
      return recipesQuery.dataUpdatedAt;
    },
    enabled: !!mountedIndex && allRecipes.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // sessionStorage-backed query / inputValue
  const query = useSyncExternalStore(
    subscribeSession,
    getQuerySnapshot,
    getServerSnapshot,
  );
  const rawInput = useSyncExternalStore(
    subscribeSession,
    getInputSnapshot,
    getServerSnapshot,
  );
  const inputValue = rawInput || undefined;

  // Step 4: run the search. Key on query only — intentionally NOT on
  // indexVersion, so an in-flight result set isn't yanked out from under
  // the user when a background re-index commits. New searches after that
  // point still hit the fresh index because FlexSearch reads live state
  // from the same mountedIndex instance.
  const { data: searchedRecipes } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const raw = await Promise.resolve(
        mountedIndex!.search(query, { merge: true, enrich: true }),
      );
      return (raw as unknown as { doc: MassagedRecipeEntry }[]).map(
        ({ doc }) => doc,
      );
    },
    enabled: !!mountedIndex && !!query,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const setInputValue = useCallback((value: string) => {
    writeSession(INPUT_KEY, value);
  }, []);

  const submitSearch = useCallback((newQuery: string) => {
    writeSession(QUERY_KEY, newQuery);
    writeSession(INPUT_KEY, newQuery);
  }, []);

  const value = useMemo<SearchContextValue>(
    () => ({
      query,
      inputValue,
      searchedRecipes,
      allRecipes,
      indexReady,
      isFetching: recipesQuery.isFetching,
      status: recipesQuery.status,
      error: recipesQuery.error as Error | null,
      setInputValue,
      submitSearch,
    }),
    [
      query,
      inputValue,
      searchedRecipes,
      allRecipes,
      indexReady,
      recipesQuery.isFetching,
      recipesQuery.status,
      recipesQuery.error,
      setInputValue,
      submitSearch,
    ],
  );

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
