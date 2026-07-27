"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Search, UtensilsCrossed } from "lucide-react";
import { PureStaticImage } from "@discontent/next-static-image/src/Pure";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@discontent/component-library/components/ui/command";
import { useSearch } from "../SearchForm/SearchContext";
import { highlightText } from "../SearchList";
import { NAV_DESTINATIONS } from "./destinations";

/** Max recipe rows the palette shows before the "See all results" overflow item. */
const MAX_RECIPE_ROWS = 6;
/** Debounce before a keystroke drives the shared FlexSearch query. */
const SEARCH_DEBOUNCE_MS = 180;

// --- context: lets the header trigger open the palette without lifting state
// into the server SiteHeader (the trigger just consumes `openPalette`). ---

interface CommandPaletteContextValue {
  openPalette: () => void;
  closePalette: () => void;
}

const CommandPaletteContext = createContext<
  CommandPaletteContextValue | undefined
>(undefined);

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error(
      "useCommandPalette must be used within a CommandPalette provider",
    );
  }
  return context;
}

export interface CommandPaletteProps {
  children: ReactNode;
  /** Owner (signed-in editor) → owner "Go to" destinations are shown. */
  isOwner?: boolean;
  /**
   * Editor-injected Sign In/Out `CommandItem`. Supplied as a ReactNode (mirroring
   * the `footerNavItems` precedent) rather than importing `next-auth/react` here —
   * that package lives only in the editor app, so a direct import would break the
   * static `export` build that also bundles this shared component. Absent in
   * export → no auth action, which is correct for the reader site.
   */
  authAction?: ReactNode;
}

/**
 * The ⌘K command palette: live recipe search + navigation ("Go to") + actions
 * (theme, editor-injected auth), in a single top-anchored `cmdk` dialog. Mounted
 * once inside `AppProviders` so it shares the search/theme/bookmarks context, and
 * it *wraps* the app tree so the header's `PaletteTrigger` can open it via
 * context.
 */
export function CommandPalette({
  children,
  isOwner = false,
  authAction,
}: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const {
    query,
    submitSearch,
    displayedRecipes,
    indexPopulated,
    isSearching,
    status,
  } = useSearch();

  const [open, setOpen] = useState(false);
  // Input value is local (drives the field as-you-type); the debounced write to
  // the shared `/search` query lags it by SEARCH_DEBOUNCE_MS.
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Controlled cmdk selection (see the snap logic below the recipe computation).
  const [selectedValue, setSelectedValue] = useState("");
  const [snappedSlug, setSnappedSlug] = useState<string | undefined>(undefined);

  // ⌘K / Ctrl-K toggle. The effect only *registers* the listener; the state
  // update lives in the handler, not the effect body, so it satisfies
  // eslint-plugin-react-hooks@7's `set-state-in-effect` rule.
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  // Flush the pending debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Seed the input from the shared query on each open (continuity with the
  // `/search` page). Derived-state-during-render — not an effect — so it never
  // trips the set-state-in-effect lint.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue(query);
  }

  // Close on route change, same derived-state pattern as `SidebarLayout`: compare
  // the live pathname to the last one seen and reset during render.
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);
  const [contextValue] = useState<CommandPaletteContextValue>(() => ({
    openPalette,
    closePalette,
  }));

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const onValueChange = useCallback(
    (next: string) => {
      setValue(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        submitSearch(next.trim());
      }, SEARCH_DEBOUNCE_MS);
    },
    [submitSearch],
  );

  const trimmed = value.trim();
  const q = trimmed.toLowerCase();

  // Static items are filtered manually (the single Command runs with
  // `shouldFilter={false}` so the live recipe rows aren't dropped by cmdk).
  const matchesQuery = (name: string, keywords?: string[]) => {
    if (!q) return true;
    const haystack = [name, ...(keywords ?? [])].join(" ").toLowerCase();
    return haystack.includes(q);
  };

  const navItems = NAV_DESTINATIONS.filter(
    (dest) =>
      (isOwner || !dest.ownerOnly) && matchesQuery(dest.name, dest.keywords),
  );

  const themeActions = [
    { name: "Theme: Light", icon: Sun, mode: "light" as const },
    { name: "Theme: Dark", icon: Moon, mode: "dark" as const },
    { name: "Theme: System", icon: Monitor, mode: "system" as const },
  ].filter((action) =>
    matchesQuery(action.name, ["appearance", "color", "mode"]),
  );

  // Only surface the injected auth item when the query plausibly targets it, so a
  // recipe search doesn't leave "Sign out" dangling under Actions.
  const showAuthAction =
    !!authAction && (!q || "sign in sign out log in log out".includes(q));

  // The recipe group is usable app-wide now that export has /search/all +
  // /search/version parity; the guard just avoids a flash before the index
  // populates (or when it has errored).
  const indexUsable = status !== "error" && (indexPopulated || isSearching);
  // Results reflect the debounced `query`, not the live `value`.
  const recipeResults = query ? (displayedRecipes ?? []) : [];
  const topRecipes = recipeResults.slice(0, MAX_RECIPE_ROWS);
  const hasMore = recipeResults.length > MAX_RECIPE_ROWS;
  const showRecipes = !!trimmed && indexUsable;
  // When a query has recipe hits, the palette enters "recipe search" mode and
  // hides the nav/actions groups, so the only selectable rows are recipes.
  const hasRecipeHits = showRecipes && topRecipes.length > 0;

  // cmdk only re-runs its first-item auto-select when the *input text* changes,
  // not when async recipe results arrive a tick later — so without help the
  // selection would be empty (nothing to open on Enter) right when results land.
  // Snap the controlled selection to the top recipe whenever a new result set
  // arrives; between result sets the user arrows freely via `onValueChange`.
  const topSlug = hasRecipeHits ? topRecipes[0]?.slug : undefined;
  if (topSlug && topSlug !== snappedSlug) {
    setSnappedSlug(topSlug);
    setSelectedValue(`recipe:${topSlug}`);
  } else if (!topSlug && snappedSlug !== undefined) {
    // Left recipe-search mode — drop the stale recipe selection so cmdk falls
    // back to highlighting the first launcher item.
    setSnappedSlug(undefined);
    setSelectedValue("");
  }

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        shouldFilter={false}
        value={selectedValue}
        onValueChange={setSelectedValue}
      >
        <CommandInput
          value={value}
          onValueChange={onValueChange}
          placeholder="Search recipes or jump to…"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {hasRecipeHits && (
            <CommandGroup heading="Recipes">
              {topRecipes.map((recipe) => (
                <CommandItem
                  key={recipe.slug}
                  value={`recipe:${recipe.slug}`}
                  onSelect={() => go(`/recipe/${recipe.slug}`)}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                    {recipe.image ? (
                      <PureStaticImage
                        slug={recipe.slug}
                        image={recipe.image}
                        alt=""
                        width={400}
                        height={600}
                        className="size-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {highlightText(recipe.name, value) || recipe.name}
                    </span>
                    {recipe.tags && recipe.tags.length > 0 && (
                      <span className="mt-1 flex gap-1">
                        {recipe.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
              {hasMore && (
                <CommandItem
                  value="see-all-results"
                  onSelect={() => {
                    submitSearch(trimmed);
                    go(`/search?q=${encodeURIComponent(trimmed)}`);
                  }}
                >
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <span>See all results for “{trimmed}”</span>
                </CommandItem>
              )}
            </CommandGroup>
          )}

          {!hasRecipeHits && navItems.length > 0 && (
            <CommandGroup heading="Go to">
              {navItems.map((dest) => {
                const Icon = dest.icon;
                return (
                  <CommandItem
                    key={dest.href}
                    value={`nav:${dest.href}`}
                    keywords={dest.keywords}
                    onSelect={() => go(dest.href)}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span>{dest.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!hasRecipeHits && (themeActions.length > 0 || showAuthAction) && (
            <CommandGroup heading="Actions">
              {themeActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.mode}
                    value={`action:theme:${action.mode}`}
                    onSelect={() => {
                      setTheme(action.mode);
                      setOpen(false);
                    }}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span>{action.name}</span>
                  </CommandItem>
                );
              })}
              {showAuthAction && authAction}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
