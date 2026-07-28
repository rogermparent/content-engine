"use client";

import { useCallback, useEffect, useRef, type SyntheticEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@discontent/component-library/lib/utils";
import { useSearch } from "./SearchContext";

/** Debounce before a keystroke drives the shared FlexSearch query. */
const SEARCH_DEBOUNCE_MS = 180;

export interface SearchInputProps {
  /** Overrides the mono placeholder (the picker modal wants a shorter one). */
  placeholder?: string;
  className?: string;
}

/**
 * The live search field — the same command surface as the ⌘K palette, at rest
 * on the page: leading magnifier, generous height, ember focus ring, no Submit
 * button. Typing filters as you go (debounced into the shared query); Enter
 * flushes the debounce immediately and commits the query to recent searches.
 *
 * Shared by `/search` and the featured-recipe picker modal, so both surfaces
 * behave identically.
 */
export function SearchInput({
  placeholder = "Search recipes by name, ingredient, or tag…",
  className,
}: SearchInputProps = {}) {
  const { inputValue, setInputValue, submitSearch, recordSearch } = useSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Only *registers* the cleanup; no state is set in the effect body, so this
  // satisfies eslint-plugin-react-hooks@7's `set-state-in-effect` rule.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onChange = useCallback(
    (value: string) => {
      // The field itself updates immediately; the (expensive) engine query lags.
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        submitSearch(value.trim());
      }, SEARCH_DEBOUNCE_MS);
    },
    [setInputValue, submitSearch],
  );

  // A real <form> is kept so Enter has its usual meaning: flush the pending
  // debounce and record the query. The submit control is sr-only — implicit
  // form submission needs a submit button to exist, but the design has none.
  const onSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const value = (inputValue || "").trim();
      submitSearch(value);
      recordSearch(value);
    },
    [inputValue, submitSearch, recordSearch],
  );

  return (
    <form onSubmit={onSubmit} role="search" className={className}>
      <div
        className={cn(
          "flex flex-row items-center gap-3 rounded-lg border border-input bg-card px-4",
          "transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        )}
      >
        <Search
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          name="query"
          aria-label="Search recipes"
          autoComplete="off"
          value={inputValue || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full min-w-0 bg-transparent text-base text-foreground outline-none",
            "placeholder:font-mono placeholder:text-sm placeholder:text-muted-foreground",
            // Safari's native search decorations fight the flanking icon.
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />
      </div>
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
