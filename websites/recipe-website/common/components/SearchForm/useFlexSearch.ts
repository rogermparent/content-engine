import { useEffect, useState } from "react";
import { Index, SearchOptions, SearchResults } from "flexsearch";

export function useFlexSearch(
  query: string | undefined,
  index: Index | undefined,
  source?: unknown,
  searchOptions?: SearchOptions | undefined,
): SearchResults {
  const [results, setResults] = useState<SearchResults>([]);
  useEffect(() => {
    if (query && index) {
      const rawResults = index.search(query, searchOptions || {});
      setResults(rawResults);
    }
  }, [query, index, searchOptions, source]);
  return results;
}
