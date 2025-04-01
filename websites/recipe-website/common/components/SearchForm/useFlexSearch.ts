import { useEffect, useState } from "react";
import {
  Document,
  DocumentSearchOptions,
  MergedDocumentSearchResults,
} from "flexsearch";

export function useFlexSearch(
  query: string | undefined,
  index: Document | undefined,
  source?: unknown,
  searchOptions?: DocumentSearchOptions | undefined
): MergedDocumentSearchResults {
  const [results, setResults] = useState<MergedDocumentSearchResults>([]);
  useEffect(() => {
    if (!query || !index) {
      setResults([]); // Reset results when query or index is missing
      return;
    }
    try {
      const rawResults = index.search(query, searchOptions || {});
      setResults(rawResults as MergedDocumentSearchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]); // Reset results on error
    }
  }, [query, index, searchOptions, source]);
  return results;
}
