import { useMemo } from "react";
import { Document } from "flexsearch";

export function useFlexSearch(
  query: string | undefined,
  index: Document | undefined,
  _source?: unknown,
  searchOptions?: Parameters<typeof Document.prototype.search>[0] | undefined,
): ReturnType<typeof Document.prototype.search> {
  const results = useMemo<ReturnType<typeof Document.prototype.search>>(() => {
    if (!query || !index) {
      return [];
    }
    try {
      const rawResults = index.search(query, searchOptions || {});
      return rawResults;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  }, [query, index, searchOptions]);
  return results;
}
