"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "recipe-website-common/context/QueryClientContext";
import { SearchProvider } from "../SearchForm/SearchContext";
import { BookmarksProvider } from "recipe-website-common/context/BookmarksContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider>
        <SearchProvider>
          <BookmarksProvider>{children}</BookmarksProvider>
        </SearchProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
