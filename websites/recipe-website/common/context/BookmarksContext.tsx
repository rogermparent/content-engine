"use client";

import React, { ReactNode, useEffect, useState } from "react";
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

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<MassagedRecipeEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBookmarks(parsed);
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveBookmarks = (newBookmarks: MassagedRecipeEntry[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newBookmarks));
  };

  const toggleBookmark = (recipe: MassagedRecipeEntry) => {
    const index = bookmarks.findIndex((b) => b.slug === recipe.slug);
    if (index >= 0) {
      const newBookmarks = [...bookmarks];
      newBookmarks.splice(index, 1);
      saveBookmarks(newBookmarks);
    } else {
      saveBookmarks([...bookmarks, recipe]);
    }
  };

  const isBookmarked = (slug: string) => {
    return bookmarks.some((b) => b.slug === slug);
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
