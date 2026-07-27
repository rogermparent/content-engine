"use client";

import { SearchIcon } from "lucide-react";
import { cn } from "@discontent/component-library/lib/utils";
import { useCommandPalette } from ".";

/**
 * The masthead's Search affordance, now a trigger for the ⌘K command palette
 * rather than a plain link to `/search`. Usable with no keyboard (it's a tap
 * target); the ⌘K hint chip is desktop-only decoration.
 *
 * - `desktop` — inline in the header's right cluster, with a `⌘K` hint.
 * - `mobile` — full-width row in the nav `Sheet`, no hint. Pass `onNavigate` to
 *   close the sheet first, so the palette dialog doesn't stack atop the sheet's.
 */
export function PaletteTrigger({
  variant = "desktop",
  onNavigate,
  className,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
}) {
  const { openPalette } = useCommandPalette();

  const handleClick = () => {
    onNavigate?.();
    openPalette();
  };

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 rounded-md p-2 text-left hover:text-primary",
          className,
        )}
      >
        <SearchIcon className="size-4 shrink-0" />
        Search
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium hover:text-primary",
        className,
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      Search
      <kbd
        aria-hidden
        className="ml-1 rounded border border-border px-1 font-mono text-[0.7rem] leading-normal text-muted-foreground"
      >
        ⌘K
      </kbd>
    </button>
  );
}
