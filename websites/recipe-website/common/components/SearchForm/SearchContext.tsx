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
const TAGS_KEY = "search-tags";
const MODE_KEY = "search-mode";

export type FilterMode = "and" | "or";

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
const getTagsSnapshot = () => readSession(TAGS_KEY);
const getModeSnapshot = () => readSession(MODE_KEY);
const getServerSnapshot = () => "";

// --- localStorage-backed last-populated index version ---
// Lives in localStorage (not sessionStorage) so it persists alongside the
// IndexedDB-cached FlexSearch index across sessions.

const LOCAL_EVENT = "recipe-search-local";
const POPULATED_VERSION_KEY = "search-populated-version";
const RECENT_SEARCHES_KEY = "search-recent";

/**
 * IndexedDB database name for the persisted FlexSearch index.
 *
 * **Bump the suffix whenever the indexed field set changes.** FlexSearch's
 * `IdxDB` adapter hard-codes its schema version at 1 and only creates its
 * object stores inside `onupgradeneeded`, which fires once per origin+DB name —
 * so adding a field to `document.index` against an existing database leaves its
 * `map:<field>` store uncreated and the first transaction throws
 * `NotFoundError`. A new name is the only thing that forces a clean create; the
 * `POPULATED_VERSION_KEY` check below can't help, because it gates *populating*
 * a database that has already been opened with the wrong schema.
 */
const SEARCH_DB_NAME = "recipe-search-v2";

/** How many committed queries the RECENT row remembers. */
const MAX_RECENT_SEARCHES = 6;

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

// --- localStorage-backed recent searches ---
// Stored as a raw JSON string so useSyncExternalStore's snapshot stays a stable
// primitive; the array is parsed once per change via useMemo below.

function getRecentSearchesRaw() {
  return localStorage.getItem(RECENT_SEARCHES_KEY) ?? "";
}

const getRecentSearchesServerSnapshot = () => "";

function parseRecentSearches(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/**
 * Fold a query to a comparison key: accent- and case-insensitive, so "Crème"
 * and "creme" don't both earn a chip. Mirrors the engine's default encoder,
 * which NFKD-normalizes and strips diacritics before tokenizing.
 */
function recentKey(query: string): string {
  return query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function writeRecentSearches(list: string[]) {
  if (list.length > 0) {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } else {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

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
  /** Unique tags across the whole corpus, sorted alphabetically. */
  allTags: string[];
  /** Tags currently constraining the result set. */
  selectedTags: string[];
  /** How selected tags combine: AND (all) or OR (any). */
  filterMode: FilterMode;
  /**
   * Results to display: the active query's matches (tag matches re-ranked
   * first) when a query is set, else the whole corpus — filtered by the
   * selected tags under the current mode. `undefined` while still resolving.
   */
  displayedRecipes: MassagedRecipeEntry[] | undefined;
  toggleTag: (tag: string) => void;
  setSelectedTags: (tags: string[]) => void;
  clearTags: () => void;
  setFilterMode: (mode: FilterMode) => void;
  indexReady: boolean;
  /** True once the index is mounted and populated, i.e. safe to search. */
  indexPopulated: boolean;
  /** A query is active and we are still building the index or running it. */
  isSearching: boolean;
  isFetching: boolean;
  status: "pending" | "success" | "error";
  error: Error | null;
  /** Re-fetch recipes/version after a failure. */
  retry: () => void;
  setInputValue: (value: string) => void;
  submitSearch: (query: string) => void;
  /** Last few *committed* queries, most-recent-first (localStorage-backed). */
  recentSearches: string[];
  /** Remember a query as recent. Call on commit, never per keystroke. */
  recordSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  // Stable Document instance.
  //
  // `index` is **priority-ordered**, not just a field list: `search(q, {merge:
  // true})` returns merged hits in `document.index` declaration order, so a name
  // hit outranks a tag hit outranks an ingredient hit outranks a description-only
  // hit — natively, with no JS re-tiering. (FlexSearch has no per-field weight,
  // and `Resolver` boosts are a verified no-op, so declaration order is the only
  // lever that works.)
  //
  // `commit: false` turns off the adapter's 1 ms autocommit timer, so the bulk
  // populate below isn't punctuated by a write per `update()`; we commit once at
  // the end. The default encoder already NFKD-normalizes and strips diacritics,
  // so "creme" matches "Crème Brûlée" without a phonetic charset.
  const [index] = useState<Document>(
    () =>
      new Document({
        preset: "default",
        tokenize: "forward",
        commit: false,
        document: {
          store: true,
          id: "slug",
          index: ["name", "tags", "ingredients", "description"],
        },
      }),
  );

  // Step 1: mount IndexedDB persistent storage
  const { data: mountedIndex } = useQuery({
    queryKey: ["search-index-mount"],
    queryFn: async () => {
      await index.mount(new IdxDB(SEARCH_DB_NAME));
      return index;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const indexReady = !!mountedIndex;

  // Step 2: check the current server-side index version. Cheap stat-based
  // endpoint; always revalidated so a fresh page load sees fresh data.
  const versionQuery = useQuery({
    queryKey: ["search-index-version"],
    queryFn: fetchIndexVersion,
    staleTime: 0,
    gcTime: Infinity,
  });
  const serverVersion = versionQuery.data;

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

  // Step 3: fetch all recipes. Fetched unconditionally (not just on a stale
  // index) because the tag filter rail and the no-query browse view both need
  // the full corpus — the recipe list, with tags, drives those directly. The
  // version check still gates the expensive FlexSearch *populate* below, so a
  // current cache skips re-indexing even though the list is fetched.
  const recipesQuery = useQuery({
    queryKey: ["recipes"],
    queryFn: fetchAllRecipes,
    staleTime: Infinity,
  });
  const allRecipes = useMemo(
    () => recipesQuery.data ?? [],
    [recipesQuery.data],
  );

  // Unique corpus tags, sorted — drives the filter rail and tag suggestions.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const recipe of allRecipes) {
      if (recipe.tags) {
        for (const tag of recipe.tags) set.add(tag);
      }
    }
    return Array.from(set).sort();
  }, [allRecipes]);

  // Step 4: populate the index with fresh recipes, then commit.
  // Keyed on dataUpdatedAt so it only re-runs on an actual refetch.
  // After commit, record the populated version so future loads with an
  // unchanged server version can skip the fetch entirely.
  const populateQuery = useQuery({
    queryKey: ["search-index-populate", recipesQuery.dataUpdatedAt],
    queryFn: async () => {
      // Clear first: `commit()` *concatenates* onto the posting lists already in
      // IndexedDB, and the in-memory `reg` dedupe guard is dropped after each
      // commit — so re-populating a surviving database (the normal path when the
      // corpus changes) would otherwise duplicate every id.
      // (`Promise.resolve` because the typings only widen `clear()` to a promise
      // when the storage generic is set explicitly; mounted, it really is async.)
      await Promise.resolve(mountedIndex!.clear());
      for (const recipe of allRecipes) {
        mountedIndex!.update(recipe);
      }
      await mountedIndex!.commit();
      if (serverVersion) writePopulatedVersion(serverVersion);
      return recipesQuery.dataUpdatedAt;
    },
    enabled: !!mountedIndex && needsRefetch && allRecipes.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // The index is searchable once it is mounted and either (a) the cached
  // version already matches the server (restored from IndexedDB, no populate
  // needed) or (b) we have just finished populating it. Gating the search on
  // this — rather than on mount alone — fixes a race where a query submitted
  // before population completes returned empty results that never updated.
  const indexPopulated =
    indexReady &&
    serverVersion !== undefined &&
    (!needsRefetch || populateQuery.isSuccess);

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

  // sessionStorage-backed tag filter + combine mode. Stored as a comma-joined
  // string (and split into a stable array via useMemo) so useSyncExternalStore
  // returns a cached snapshot rather than a fresh array each render.
  const rawTags = useSyncExternalStore(
    subscribeSession,
    getTagsSnapshot,
    getServerSnapshot,
  );
  const selectedTags = useMemo(
    () => (rawTags ? rawTags.split(",").filter(Boolean) : []),
    [rawTags],
  );
  const rawMode = useSyncExternalStore(
    subscribeSession,
    getModeSnapshot,
    getServerSnapshot,
  );
  const filterMode: FilterMode = rawMode === "or" ? "or" : "and";

  const setSelectedTags = useCallback((tags: string[]) => {
    writeSession(TAGS_KEY, tags.join(","));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    const current = getTagsSnapshot();
    const list = current ? current.split(",").filter(Boolean) : [];
    const next = list.includes(tag)
      ? list.filter((t) => t !== tag)
      : [...list, tag];
    writeSession(TAGS_KEY, next.join(","));
  }, []);

  const clearTags = useCallback(() => {
    writeSession(TAGS_KEY, "");
  }, []);

  const setFilterMode = useCallback((mode: FilterMode) => {
    // Default is "and", so persist only the non-default to keep storage/URL clean.
    writeSession(MODE_KEY, mode === "or" ? "or" : "");
  }, []);

  // Step 5: run the search. Key on query only — intentionally NOT on
  // indexVersion, so an in-flight result set isn't yanked out from under
  // the user when a background re-index commits. New searches after that
  // point still hit the fresh index because FlexSearch reads live state
  // from the same mountedIndex instance.
  //
  // Gated on indexPopulated: a query submitted before the index finishes
  // populating stays pending (React Query auto-runs it once enabled flips
  // true), instead of running against an empty index and caching nothing.
  const searchQuery = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      // `suggest: true` is what makes multi-word queries usable: without it a
      // single unmatched term zeroes the whole result set, so "chocolate jujube"
      // returned nothing at all instead of the chocolate recipes.
      const raw = await Promise.resolve(
        mountedIndex!.search(query, {
          merge: true,
          enrich: true,
          suggest: true,
        }),
      );
      return (raw as unknown as { doc: MassagedRecipeEntry }[]).map(
        ({ doc }) => doc,
      );
    },
    enabled: indexPopulated && !!query,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const searchedRecipes = searchQuery.data;

  // Displayed set: the engine's ranked matches when searching, else the whole
  // corpus (browse) — then constrained by the selected tags under the mode.
  //
  // Field priority (name > tags > ingredients > description) is native: it falls
  // out of the `document.index` declaration order above, so there is no JS
  // re-tiering pass here. `SearchResultsModal` reads `searchedRecipes` directly
  // and now inherits the same ranking for free.
  const displayedRecipes = useMemo(() => {
    const base = query ? searchedRecipes : allRecipes;
    if (!base) return base;
    if (selectedTags.length === 0) return base;
    return base.filter((recipe) => {
      const tags = recipe.tags ?? [];
      return filterMode === "and"
        ? selectedTags.every((tag) => tags.includes(tag))
        : selectedTags.some((tag) => tags.includes(tag));
    });
  }, [query, searchedRecipes, allRecipes, selectedTags, filterMode]);

  // A query is active but results aren't ready yet — either the index is
  // still building or the search itself is running.
  const isSearching =
    !!query && (!indexPopulated || searchedRecipes === undefined);

  const setInputValue = useCallback((value: string) => {
    writeSession(INPUT_KEY, value);
  }, []);

  const submitSearch = useCallback((newQuery: string) => {
    writeSession(QUERY_KEY, newQuery);
    writeSession(INPUT_KEY, newQuery);
  }, []);

  // Recent searches. Recorded on *commit* (Enter, a chip click, opening a
  // result) rather than per keystroke, so live typing doesn't leave "c", "cr",
  // "cre" behind.
  const rawRecent = useSyncExternalStore(
    subscribeLocal,
    getRecentSearchesRaw,
    getRecentSearchesServerSnapshot,
  );
  const recentSearches = useMemo(
    () => parseRecentSearches(rawRecent),
    [rawRecent],
  );

  const recordSearch = useCallback((newQuery: string) => {
    const trimmed = newQuery.trim();
    if (!trimmed) return;
    const key = recentKey(trimmed);
    if (!key) return;
    const previous = parseRecentSearches(getRecentSearchesRaw());
    const next = [
      trimmed,
      ...previous.filter((item) => recentKey(item) !== key),
    ].slice(0, MAX_RECENT_SEARCHES);
    writeRecentSearches(next);
  }, []);

  const clearRecentSearches = useCallback(() => {
    writeRecentSearches([]);
  }, []);

  const retry = useCallback(() => {
    versionQuery.refetch();
    recipesQuery.refetch();
  }, [versionQuery, recipesQuery]);

  // Surface failures from either the version check or the recipes fetch.
  const error = (recipesQuery.error ?? versionQuery.error) as Error | null;
  const status: "pending" | "success" | "error" = error
    ? "error"
    : recipesQuery.status;

  const value = useMemo<SearchContextValue>(
    () => ({
      query,
      inputValue,
      searchedRecipes,
      allRecipes,
      allTags,
      selectedTags,
      filterMode,
      displayedRecipes,
      toggleTag,
      setSelectedTags,
      clearTags,
      setFilterMode,
      indexReady,
      indexPopulated,
      isSearching,
      isFetching: recipesQuery.isFetching,
      status,
      error,
      retry,
      setInputValue,
      submitSearch,
      recentSearches,
      recordSearch,
      clearRecentSearches,
    }),
    [
      query,
      inputValue,
      searchedRecipes,
      allRecipes,
      allTags,
      selectedTags,
      filterMode,
      displayedRecipes,
      toggleTag,
      setSelectedTags,
      clearTags,
      setFilterMode,
      indexReady,
      indexPopulated,
      isSearching,
      recipesQuery.isFetching,
      status,
      error,
      retry,
      setInputValue,
      submitSearch,
      recentSearches,
      recordSearch,
      clearRecentSearches,
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
