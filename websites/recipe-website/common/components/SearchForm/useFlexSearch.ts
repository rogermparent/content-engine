import { useEffect, useState } from "react";
import { Index, Id, SearchOptions } from "flexsearch";

export function useFlexSearch(
  query: string | undefined,
  index: Index | undefined,
  source?: unknown,
  searchOptions?: SearchOptions | undefined,
): Id[] {
  const [results, setResults] = useState<Id[]>([]);
  useEffect(() => {
    if (query && index) {
      const rawResults = index.search(query, searchOptions || {});
      setResults(rawResults);
    }
  }, [query, index, searchOptions, source]);
  return results;
}
