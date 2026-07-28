"use client";

import { Badge } from "@discontent/component-library/components/ui/badge";
import { Button } from "@discontent/component-library/components/ui/button";
import { useSearch } from "./SearchContext";

/**
 * The RECENT row: ember-outlined chips for the last few *committed* queries.
 * Only rendered on the idle `/search` view (no query, no tags) — it is a
 * standing-start affordance, so it vanishes the moment the user types.
 */
export function RecentSearches() {
  const { recentSearches, submitSearch, clearRecentSearches } = useSearch();

  if (recentSearches.length === 0) return null;

  return (
    <div className="my-3 flex flex-row flex-wrap items-center gap-2">
      <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        Recent
      </span>
      {recentSearches.map((entry) => (
        <button
          key={entry}
          type="button"
          onClick={() => submitSearch(entry)}
          aria-label={`Search again for ${entry}`}
          className="rounded-md focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <Badge
            variant="outline"
            className="cursor-pointer border-primary/50 text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {entry}
          </Badge>
        </button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clearRecentSearches}
      >
        Clear
      </Button>
    </div>
  );
}
