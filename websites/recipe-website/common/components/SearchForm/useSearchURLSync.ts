"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "./SearchContext";

/**
 * Hook to synchronize search query with URL parameters
 * Only active when enabled === true (for page mode)
 */
export function useSearchURLSync(enabled: boolean) {
  const searchParams = useSearchParams();
  const { query, submitSearch, inputValue } = useSearch();

  // Initialize from URL on mount
  useEffect(() => {
    if (enabled && inputValue === undefined) {
      const urlQuery = searchParams.get("q");
      if (urlQuery) {
        submitSearch(urlQuery);
      }
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
      console.log(urlQuery);
      if (typeof urlQuery === "string") {
        submitSearch(urlQuery);
      }
    };

    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, [enabled, submitSearch]);
}
