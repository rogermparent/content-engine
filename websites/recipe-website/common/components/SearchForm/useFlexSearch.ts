import { useEffect, useState } from "react";
import { Document } from "flexsearch";

export function useFlexSearch(
  query: string | undefined,
  index: Document | undefined,
  source?: unknown,
  searchOptions?: Parameters<typeof Document.prototype.search>[0] | undefined,
): ReturnType<typeof Document.prototype.search> {
  const [results, setResults] = useState<
    ReturnType<typeof Document.prototype.search>
  >([]);
  useEffect(() => {
    if (!query || !index) {
      setResults([]);
      return;
    }
    try {
      const rawResults = index.search(query, searchOptions || {});
      setResults(rawResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    }
  }, [query, index, searchOptions, source]);
  return results;
}
