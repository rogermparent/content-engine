"use client";

import clsx from "clsx";
import { Badge } from "@discontent/component-library/components/ui/badge";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@discontent/component-library/components/ui/toggle-group";
import { useSearch } from "./SearchContext";

/**
 * A horizontal rail of tag chips for the whole corpus. Each chip toggles that
 * tag in the shared search state; an AND/OR control decides how multiple
 * selected tags combine. Rendered above the results so it works as a browse
 * affordance even with no text query.
 */
export function TagFilterRail() {
  const {
    allTags,
    selectedTags,
    toggleTag,
    clearTags,
    filterMode,
    setFilterMode,
  } = useSearch();

  if (allTags.length === 0) return null;

  return (
    <div className="my-2 flex flex-col gap-2" aria-label="Tag filters">
      <div className="flex flex-row flex-wrap items-center gap-1.5">
        {allTags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={selected}
              aria-label={`Filter by tag ${tag}`}
            >
              <Badge
                variant={selected ? "secondary" : "outline"}
                className={clsx(
                  "cursor-pointer",
                  selected
                    ? "ring-2 ring-inset ring-primary font-semibold"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {tag}
              </Badge>
            </button>
          );
        })}
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-row flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span id="tag-combine-label">Match</span>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={filterMode}
            onValueChange={(value) => {
              if (value === "and" || value === "or") setFilterMode(value);
            }}
            aria-labelledby="tag-combine-label"
          >
            <ToggleGroupItem value="and" aria-label="Match all selected tags">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="or" aria-label="Match any selected tag">
              Any
            </ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" variant="ghost" size="sm" onClick={clearTags}>
            Clear tags
          </Button>
        </div>
      )}
    </div>
  );
}
