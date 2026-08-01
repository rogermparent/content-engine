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
import {
  fold,
  matchesFilter,
  parseQuery,
  toggleTagTerm as toggleTagTermIn,
  type ParsedQuery,
} from "./queryLanguage";

// --- sessionStorage-backed state via useSyncExternalStore ---

const SESSION_EVENT = "recipe-search-storage";
const QUERY_KEY = "search-query";
const INPUT_KEY = "search-inputValue";

/**
 * Debounce before a keystroke drives the shared FlexSearch query. Lives here —
 * beside the query state it feeds — so the two live surfaces (`SearchInput` and
 * the ⌘K palette) can't drift apart; they carried private copies of the same
 * number until PR 20.
 */
export const SEARCH_DEBOUNCE_MS = 180;

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

/**
 * Corpus version last populated into `SEARCH_DB_NAME`.
 *
 * **Namespaced by the database name on purpose.** This marker lives in
 * localStorage while the index it vouches for lives in IndexedDB, so a bare key
 * outlived the database it described: bumping `SEARCH_DB_NAME` above mounted a
 * new, *empty* database while the old marker still claimed the corpus was
 * current, leaving `needsRefetch` false and the populate skipped. Search then
 * ran against nothing — zero results, no error, no spinner, permanently.
 *
 * It only bit deployments whose corpus was unchanged across the rebuild, since
 * the version string is `data.mdb`'s mtime+size: a dev machine edits recipes
 * constantly, so its version moved and repopulated, masking the whole thing.
 * Tying the two names together means a database bump can no longer leave a
 * marker behind to lie about it.
 */
const POPULATED_VERSION_KEY = `search-populated-version:${SEARCH_DB_NAME}`;

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
 * and "creme" don't both earn a chip. `fold` is the query language's shared
 * helper — the same one the filter evaluates and `highlightText` marks with, so
 * all three agree on what counts as the same word.
 */
function recentKey(query: string): string {
  return fold(query).trim();
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
  /**
   * `query` split into the free text the engine runs and the filter AST
   * evaluated over its results. The query string is the *only* filter state —
   * there is no parallel selection to keep in step, and nothing invisible.
   */
  parsedQuery: ParsedQuery;
  inputValue: string | undefined;
  searchedRecipes: MassagedRecipeEntry[] | undefined;
  allRecipes: MassagedRecipeEntry[];
  /** Unique tags across the whole corpus, sorted alphabetically. */
  allTags: string[];
  /**
   * Results to display: the engine's ranked matches for the query's free text
   * (or the whole corpus, when it has none), narrowed by the query's filter.
   * `undefined` while still resolving.
   */
  displayedRecipes: MassagedRecipeEntry[] | undefined;
  /** Add or remove a `tag:` term in the query — the one chip mutation path. */
  toggleTagTerm: (tag: string) => void;
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
  /** Forget a single recent query (matched accent-insensitively). */
  removeRecentSearch: (query: string) => void;
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

  // Step 3b: trust, but verify.
  //
  // A matching version says the mounted database already holds the corpus — but
  // the marker saying so lives in localStorage while the index itself lives in
  // IndexedDB, and a browser can drop one without the other (eviction under
  // storage pressure, a database bump, a commit that never finished). Whenever
  // they diverge, a matching version vouches for an empty index and search
  // returns nothing at all, with no error to surface and no spinner to explain
  // it. Probing one slug we know the corpus contains catches every such case for
  // a single `reg`-store read, and costs nothing on the healthy path.
  const probeSlug = allRecipes[0]?.slug;
  const probeEnabled = !!mountedIndex && !!probeSlug;
  const probeQuery = useQuery({
    queryKey: ["search-index-probe", SEARCH_DB_NAME, probeSlug],
    // (`Promise.resolve` because the typings only widen `contain()` to a promise
    // when the storage generic is set explicitly; mounted, it really is async.)
    queryFn: async () => Promise.resolve(mountedIndex!.contain(probeSlug!)),
    enabled: probeEnabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // A failed probe counts as missing: if we cannot read the database we cannot
  // claim it is current, and repopulating is the cheap, safe direction to err in.
  const indexEmpty =
    probeEnabled && (probeQuery.isError || probeQuery.data === false);
  // Nothing to verify when the corpus is empty; otherwise wait for the verdict
  // before letting anything downstream call the index ready.
  const probeSettled =
    !probeEnabled || probeQuery.isSuccess || probeQuery.isError;

  // Repopulate when the server's corpus moved past what we last populated, or
  // when the probe says the database is not actually holding it.
  const needsRefetch =
    serverVersion !== undefined &&
    (serverVersion !== populatedVersion || indexEmpty);

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

  // The index is searchable once it is mounted, the probe has reported back,
  // and either (a) the cached version already matches the server *and* the probe
  // found the corpus there (restored from IndexedDB, no populate needed) or
  // (b) we have just finished populating it. Gating the search on this — rather
  // than on mount alone — fixes a race where a query submitted before population
  // completes returned empty results that never updated. Waiting on
  // `probeSettled` closes the same race for the verification step: without it a
  // matching version would call the index ready for the moment or two before the
  // probe disproves it, and a search running in that window caches an empty
  // result set under `staleTime: Infinity`.
  const indexPopulated =
    indexReady &&
    serverVersion !== undefined &&
    probeSettled &&
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

  // The query *is* the filter state. Parsed once here into the free text the
  // engine runs and the filter AST applied to its results — so the two can't
  // drift, and there is nothing to keep in sessionStorage beside the string.
  const parsedQuery = useMemo(() => parseQuery(query), [query]);
  const { text: searchText, filter } = parsedQuery;

  // Step 5: run the search. Key on the **free text**, not the raw query, so
  // editing a filter term (`tag:` on, `tag:` off) neither invalidates the cache
  // nor re-runs the engine for a result set that cannot have changed.
  //
  // Intentionally NOT keyed on indexVersion either, so an in-flight result set
  // isn't yanked out from under the user when a background re-index commits.
  // New searches after that point still hit the fresh index because FlexSearch
  // reads live state from the same mountedIndex instance.
  //
  // Gated on indexPopulated: a query submitted before the index finishes
  // populating stays pending (React Query auto-runs it once enabled flips
  // true), instead of running against an empty index and caching nothing.
  const searchQuery = useQuery({
    queryKey: ["search", searchText],
    queryFn: async () => {
      // `suggest: true` is what makes multi-word queries usable: without it a
      // single unmatched term zeroes the whole result set, so "chocolate jujube"
      // returned nothing at all instead of the chocolate recipes.
      const raw = await Promise.resolve(
        mountedIndex!.search(searchText, {
          merge: true,
          enrich: true,
          suggest: true,
        }),
      );
      return (raw as unknown as { doc: MassagedRecipeEntry }[]).map(
        ({ doc }) => doc,
      );
    },
    enabled: indexPopulated && !!searchText,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const searchedRecipes = searchQuery.data;

  // Displayed set: the engine's ranked matches when there is free text to run,
  // else the whole corpus (browse) — then narrowed by the query's filter. Same
  // shape as the tag filter it replaces, so consumers barely moved.
  //
  // Field priority (name > tags > ingredients > description) is native: it falls
  // out of the `document.index` declaration order above, so there is no JS
  // re-tiering pass here. Filtering preserves that order.
  const displayedRecipes = useMemo(() => {
    const base = searchText ? searchedRecipes : allRecipes;
    if (!base || !filter) return base;
    return base.filter((recipe) => matchesFilter(recipe, filter));
  }, [searchText, filter, searchedRecipes, allRecipes]);

  // Free text is active but results aren't ready yet — either the index is
  // still building or the search itself is running. A filter-only query
  // (`tag:dessert`) never reaches the engine, so it is never "searching".
  const isSearching =
    !!searchText && (!indexPopulated || searchedRecipes === undefined);

  const setInputValue = useCallback((value: string) => {
    writeSession(INPUT_KEY, value);
  }, []);

  const submitSearch = useCallback((newQuery: string) => {
    writeSession(QUERY_KEY, newQuery);
    writeSession(INPUT_KEY, newQuery);
  }, []);

  // Chip surfaces (the rail, the card chips) rewrite the query rather than
  // holding a selection of their own. Read from the store rather than closing
  // over `query`, so the callback stays stable across keystrokes.
  const toggleTagTerm = useCallback((tag: string) => {
    const next = toggleTagTermIn(getQuerySnapshot(), tag);
    writeSession(QUERY_KEY, next);
    writeSession(INPUT_KEY, next);
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

  // Drop one entry. Matched through the same fold as `recordSearch`'s dedupe, so
  // deleting the chip you see removes the entry that chip stands for even when
  // the stored spelling is accented differently.
  const removeRecentSearch = useCallback((target: string) => {
    const key = recentKey(target);
    if (!key) return;
    const previous = parseRecentSearches(getRecentSearchesRaw());
    writeRecentSearches(previous.filter((item) => recentKey(item) !== key));
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
      parsedQuery,
      inputValue,
      searchedRecipes,
      allRecipes,
      allTags,
      displayedRecipes,
      toggleTagTerm,
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
      removeRecentSearch,
      clearRecentSearches,
    }),
    [
      query,
      parsedQuery,
      inputValue,
      searchedRecipes,
      allRecipes,
      allTags,
      displayedRecipes,
      toggleTagTerm,
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
      removeRecentSearch,
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
