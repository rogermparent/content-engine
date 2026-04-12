"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "./SearchContext";

/**
 * Hook to synchronize search query with URL parameters
 * Only active when enabled === true (for page mode)
 */
export function useSearchURLSync(enabled: boolean) {
  const searchParams = useSearchParams();
  const { query, submitSearch, inputValue } = useSearch();

  // Initialize from URL exactly once per mount — only if sessionStorage
  // didn't already seed a value. Using a ref prevents this from re-firing
  // when the user clears the input (which also makes inputValue undefined).
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;
    if (inputValue !== undefined) return;
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      submitSearch(urlQuery);
    }
  }, [enabled, searchParams, submitSearch, inputValue]);

  // Sync query to URL
  useEffect(() => {
    if (enabled) {
      const currentURL = new URL(window.location.href);
      const currentURLQuery = currentURL.searchParams.get("q") || "";
      if (currentURLQuery !== query) {
        if (query) {
          currentURL.searchParams.set("q", query);
        } else {
          currentURL.searchParams.delete("q");
        }
        if (query) {
          history.pushState({ q: query }, "", currentURL.toString());
        }
      }
    }
  }, [enabled, query]);

  // Listen to browser back/forward
  useEffect(() => {
    if (!enabled) return;

    const listener = (e: PopStateEvent) => {
      const urlQuery = e.state?.q;
      if (typeof urlQuery === "string") {
        submitSearch(urlQuery);
      }
    };

    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, [enabled, submitSearch]);
}
