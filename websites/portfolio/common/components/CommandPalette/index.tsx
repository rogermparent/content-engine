"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, FolderOpen, FileText } from "lucide-react";
import { fold } from "@discontent/component-library/lib/fold";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@discontent/component-library/components/ui/command";
import type { ProjectIndexEntry } from "@discontent/projects-collection/controller/data/readIndex";
import { highlightMatch } from "../Index/highlight";

/*
 * ⌘K over the works.
 *
 * The corpus is a **prop**, read on the server by the layout that renders this —
 * not fetched from `/search/all`. That route exists for a client that wants the
 * index without the page, but the palette is rendered by a server component
 * which already has the data, and a portfolio corpus is dozens of entries. A
 * fetch here would add a round trip, a loading state and a failure mode to buy
 * nothing.
 *
 * This is deliberately not a port of recipe's 540-line palette. That one carries
 * recent-search history, ingredient-match explanations, a debounced FlexSearch
 * query and an overflow route to `/search`. Portfolio has no `/search` page by
 * decision, and no ingredients; what is left is: filter, group, navigate.
 */

/** Rows shown before the list stops — the dialog caps its own height anyway. */
const MAX_ROWS = 6;

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
      "useCommandPalette must be used within a CommandPaletteProvider",
    );
  }
  return context;
}

/** Nav targets that always exist, independent of content. */
const NAV_DESTINATIONS = [
  { name: "Work", href: "/", icon: FolderOpen },
  { name: "About", href: "/about", icon: FileText },
];

export function CommandPaletteProvider({
  projects,
  children,
}: {
  projects: ProjectIndexEntry[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { setTheme } = useTheme();

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  // ⌘K / Ctrl+K. Both modifiers, because the trigger's hint chip promises
  // whichever one this platform uses.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // cmdk does its own filtering, but it scores on the rendered text only — so a
  // project matched by *tag* would be filtered out before it could explain
  // itself. Filtering here, with `shouldFilter={false}` below, keeps tag and
  // role matches reachable.
  const results = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle) return projects.slice(0, MAX_ROWS);
    return projects
      .filter((project) => {
        if (fold(project.name).includes(needle)) return true;
        if (project.tags?.some((tag) => fold(tag).includes(needle)))
          return true;
        if (project.role && fold(project.role).includes(needle)) return true;
        if (project.client && fold(project.client).includes(needle))
          return true;
        return false;
      })
      .slice(0, MAX_ROWS);
  }, [projects, query]);

  const go = useCallback(
    (href: string) => {
      // Navigate *before* closing. Closing first unmounts the dialog, and the
      // focus restoration that Radix runs on unmount was swallowing the
      // navigation — the palette shut and the route never changed.
      router.push(href);
      setOpen(false);
      setQuery("");
    },
    [router],
  );

  const value = useMemo(
    () => ({ openPalette, closePalette }),
    [openPalette, closePalette],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        label="Search works"
        // cmdk's own filter is off because it scores on rendered text only, so a
        // tag- or role-only match would be filtered out before it could appear.
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search works…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/*
            Scoped to the Works group rather than using `CommandEmpty`: the nav
            and appearance groups are always present, so the list as a whole is
            never empty and `CommandEmpty` would never render.
          */}
          {query.trim() && results.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              No works match.
            </div>
          )}

          {results.length > 0 && (
            <CommandGroup heading="Works">
              {results.map((project) => (
                <CommandItem
                  key={project.slug}
                  value={`project:${project.slug}`}
                  onSelect={() => go(`/project/${project.slug}`)}
                >
                  <span className="flex w-full flex-row items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {new Date(project.date).getUTCFullYear()}
                    </span>
                    <span className="grow">
                      {highlightMatch(project.name, query)}
                    </span>
                    {project.status && (
                      <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                        {project.status}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Go to">
            {NAV_DESTINATIONS.map(({ name, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={`nav:${href}`}
                onSelect={() => go(href)}
              >
                <Icon className="size-4 shrink-0" />
                {name}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Appearance">
            <CommandItem
              value="mode:light"
              onSelect={() => {
                setTheme("light");
                setOpen(false);
              }}
            >
              <Sun className="size-4 shrink-0" />
              Light
            </CommandItem>
            <CommandItem
              value="mode:dark"
              onSelect={() => {
                setTheme("dark");
                setOpen(false);
              }}
            >
              <Moon className="size-4 shrink-0" />
              Dark
            </CommandItem>
            <CommandItem
              value="mode:system"
              onSelect={() => {
                setTheme("system");
                setOpen(false);
              }}
            >
              <Monitor className="size-4 shrink-0" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
