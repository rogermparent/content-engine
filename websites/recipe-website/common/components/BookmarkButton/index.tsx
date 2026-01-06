"use client";

import { Button } from "component-library/components/ui/button";
import { useBookmarks } from "../../context/BookmarksContext";
import { MassagedRecipeEntry } from "../../controller/data/read";
import clsx from "clsx";

export default function BookmarkButton({
  recipe,
  className,
}: {
  recipe: MassagedRecipeEntry;
  className?: string;
}) {
  // Hydration safety: we only want to show the active state on client
  const context = useBookmarks();
  // If context is missing (e.g. server rendering without provider up tree, or before hydration), handle gracefully
  if (!context) return null;

  const [{ isLoaded }, { toggleBookmark, isBookmarked }] = context;
  const bookmarked = isBookmarked(recipe.slug);

  return (
    <Button
      disabled={!isLoaded}
      variant="ghost"
      size="sm"
      className={clsx("p-2 bg-slate-400/25", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(recipe);
      }}
      title={bookmarked ? "Remove Bookmark" : "Bookmark"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={clsx(
          "w-6 h-6 transition-colors duration-200",
          bookmarked
            ? "text-yellow-500"
            : "text-slate-400 hover:text-yellow-500",
        )}
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    </Button>
  );
}
