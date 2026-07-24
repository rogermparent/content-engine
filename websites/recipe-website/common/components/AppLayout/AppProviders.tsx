"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "recipe-website-common/context/QueryClientContext";
import { SearchProvider } from "../SearchForm/SearchContext";
import { BookmarksProvider } from "recipe-website-common/context/BookmarksContext";
import type { ColorMode } from "@discontent/component-library/theming";
import { ThemeVarsProvider } from "./ThemeVarsProvider";

export function AppProviders({
  children,
  defaultMode = "system",
}: {
  children: ReactNode;
  defaultMode?: ColorMode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultMode}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeVarsProvider>
        <QueryClientProvider>
          <SearchProvider>
            <BookmarksProvider>{children}</BookmarksProvider>
          </SearchProvider>
        </QueryClientProvider>
      </ThemeVarsProvider>
    </ThemeProvider>
  );
}
