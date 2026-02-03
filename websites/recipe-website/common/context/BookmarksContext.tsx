"use client";

import React, { ReactNode, useMemo, useSyncExternalStore } from "react";
import { MassagedRecipeEntry } from "../controller/data/read";

interface BookmarksState {
  bookmarks: MassagedRecipeEntry[];
}

interface BookmarksActions {
  toggleBookmark: (recipe: MassagedRecipeEntry) => void;
  isBookmarked: (slug: string) => boolean;
}

const BookmarksContext = React.createContext<
  [BookmarksState, BookmarksActions] | undefined
>(undefined);

const LOCAL_STORAGE_KEY = "recipe_bookmarks";

const getBookmarksSnapshot = () => localStorage.getItem(LOCAL_STORAGE_KEY);
const getServerBookmarksSnapshot = () => null;

const subscribeBookmarks = (callback: () => void) => {
  window.addEventListener("recipe-bookmarks", callback);
  return () => {
    window.removeEventListener("recipe-bookmarks", callback);
  };
};

const saveBookmarks = (newBookmarks: MassagedRecipeEntry[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newBookmarks));
  window.dispatchEvent(new Event("recipe-bookmarks"));
};

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const storedBookmarks = useSyncExternalStore(
    subscribeBookmarks,
    getBookmarksSnapshot,
    getServerBookmarksSnapshot,
  );

  const bookmarks = useMemo(() => {
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  }, [storedBookmarks]);

  const toggleBookmark = (recipe: MassagedRecipeEntry) => {
    if (typeof window !== "undefined") {
      const index = bookmarks.findIndex(
        (b: MassagedRecipeEntry) => b.slug === recipe.slug,
      );
      if (index >= 0) {
        const newBookmarks = [...bookmarks];
        newBookmarks.splice(index, 1);
        saveBookmarks(newBookmarks);
      } else {
        saveBookmarks([...bookmarks, recipe]);
      }
    }
  };

  const isBookmarked = (slug: string) => {
    return bookmarks.some((b: MassagedRecipeEntry) => b.slug === slug);
  };

  return (
    <BookmarksContext.Provider
      value={[{ bookmarks }, { toggleBookmark, isBookmarked }]}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = React.useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error("useBookmarks must be used within a BookmarksProvider");
  }
  return context;
}
