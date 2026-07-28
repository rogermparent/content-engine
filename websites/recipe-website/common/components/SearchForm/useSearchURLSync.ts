"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "./SearchContext";

/**
 * Synchronize the search query, tag filter, and combine mode with the URL.
 * Only active when enabled === true (page mode; the modal disables it).
 */
export function useSearchURLSync(enabled: boolean) {
  const searchParams = useSearchParams();
  const {
    query,
    submitSearch,
    inputValue,
    selectedTags,
    setSelectedTags,
    filterMode,
    setFilterMode,
  } = useSearch();

  // Initialize from URL exactly once per mount — only if sessionStorage didn't
  // already seed a value. Using a ref prevents this from re-firing when the
  // user clears the input (which also makes inputValue undefined).
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;
    // Only seed from the URL when session state is empty for that field.
    if (inputValue === undefined) {
      const urlQuery = searchParams.get("q");
      if (urlQuery) submitSearch(urlQuery);
    }
    if (selectedTags.length === 0) {
      const urlTags = searchParams.get("tags");
      if (urlTags) setSelectedTags(urlTags.split(",").filter(Boolean));
    }
    const urlMode = searchParams.get("mode");
    if (urlMode === "or") setFilterMode("or");
  }, [
    enabled,
    searchParams,
    submitSearch,
    inputValue,
    selectedTags,
    setSelectedTags,
    setFilterMode,
  ]);

  // Sync query / tags / mode to the URL, so a search stays shareable and
  // reload-safe.
  //
  // `replaceState`, not `pushState`: the field is live now, and pushing per
  // query change would stack a history entry for every debounced keystroke —
  // "chocolate" alone would bury the previous page under nine back presses.
  // Deep links still work (the seeding effect above reads `?q=`/`?tags=` on
  // mount) and the popstate handler below still restores state for entries
  // pushed by real navigations.
  useEffect(() => {
    if (!enabled) return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const before = params.toString();

    if (query) params.set("q", query);
    else params.delete("q");

    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    else params.delete("tags");

    if (filterMode === "or" && selectedTags.length > 0)
      params.set("mode", "or");
    else params.delete("mode");

    const after = params.toString();
    if (after !== before) {
      history.replaceState(
        { q: query, tags: selectedTags, mode: filterMode },
        "",
        url.toString(),
      );
    }
  }, [enabled, query, selectedTags, filterMode]);

  // Listen to browser back/forward.
  useEffect(() => {
    if (!enabled) return;

    const listener = (e: PopStateEvent) => {
      const urlQuery = e.state?.q;
      if (typeof urlQuery === "string") submitSearch(urlQuery);
      const urlTags = e.state?.tags;
      if (Array.isArray(urlTags)) setSelectedTags(urlTags);
      const urlMode = e.state?.mode;
      if (urlMode === "or" || urlMode === "and") setFilterMode(urlMode);
    };

    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, [enabled, submitSearch, setSelectedTags, setFilterMode]);
}
