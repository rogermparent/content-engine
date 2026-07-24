import Link from "next/link";
import getMenuBySlug from "@discontent/menus-collection/controller/data/read";
import { MenuItem } from "@discontent/menus-collection/controller/types";
import { ReactNode } from "react";
import {
  serializeThemeCss,
  THEME_VARS_STORAGE_KEY,
  MODE_STORAGE_KEY,
  type Theme,
  type ColorMode,
} from "@discontent/component-library/theming";
import { AppProviders } from "./AppProviders";
import { getSiteConfig } from "../../config/site";
import { HeaderNav, FooterNav } from "./nav";
import { fontVariables } from "./fonts";

/**
 * Blocking pre-paint script: mirror ThemeVarsProvider before first paint so a
 * visitor's saved theme override applies without a flash. Reads the resolved
 * {light,dark} var maps and the next-themes mode from localStorage, then sets
 * the resolved mode's tokens as inline CSS vars on <html> (inline beats the SSR
 * <style> default and the .dark class). No override → does nothing, and the
 * site-default <style> shows through.
 */
function themePrePaintScript(defaultMode: ColorMode): string {
  return `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
    THEME_VARS_STORAGE_KEY,
  )});if(!raw)return;var maps=JSON.parse(raw);var mode=localStorage.getItem(${JSON.stringify(
    MODE_STORAGE_KEY,
  )})||${JSON.stringify(
    defaultMode,
  )};if(mode==="system"){mode=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var map=maps[mode==="dark"?"dark":"light"];if(!map)return;var el=document.documentElement;for(var k in map){el.style.setProperty(k,map[k]);}}catch(e){}})();`;
}

const defaultFooterItems: MenuItem[] = [
  { name: "Search", href: "/search" },
  { name: "New Recipe", href: "/new-recipe" },
  { name: "Settings", href: "/settings" },
];

const defaultHeaderItems: MenuItem[] = [
  { name: "Bookmarks", href: "/bookmarks" },
];

interface SiteHeaderProps {
  extraNavItems?: ReactNode;
}

async function SiteHeader({ extraNavItems }: SiteHeaderProps) {
  const headerMenu = await getMenuBySlug<MenuItem>("header");
  const headerItems = [...defaultHeaderItems, ...(headerMenu?.items || [])];
  const { title } = getSiteConfig();

  return (
    <header className="relative w-full bg-card print:hidden border-b border-border">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">{title}</h1>
      </Link>
      <HeaderNav items={headerItems} extraNavItems={extraNavItems} />
    </header>
  );
}

interface SiteFooterProps {
  extraNavItems?: ReactNode;
}

async function SiteFooter({ extraNavItems }: SiteFooterProps) {
  const footerMenu = await getMenuBySlug<MenuItem>("footer");
  const footerItems = footerMenu?.items || defaultFooterItems;
  return (
    <footer className="w-full bg-card print:hidden border-t border-border">
      <FooterNav items={footerItems} extraNavItems={extraNavItems} />
    </footer>
  );
}

export interface AppLayoutProps {
  children: React.ReactNode;
  headerNavItems?: ReactNode;
  footerNavItems?: ReactNode;
  /** Site-default theme (owner-persisted). SSR-injected flash-free. */
  theme?: Theme;
}

export async function AppLayout({
  children,
  headerNavItems,
  footerNavItems,
  theme,
}: AppLayoutProps) {
  const defaultMode = theme?.defaultMode ?? "system";
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="bg-background flex flex-col flex-nowrap items-center min-w-fit w-full">
        {/*
         * Site-default token overrides as the first child of <body> so they win
         * over styles/theme.css (same specificity, later in source order) for
         * both light and dark with no JS. Deterministic markup → no hydration
         * mismatch. The pre-paint script then layers any per-visitor override.
         */}
        {theme && (
          <style
            data-theme-default
            dangerouslySetInnerHTML={{ __html: serializeThemeCss(theme) }}
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: themePrePaintScript(defaultMode),
          }}
        />
        <AppProviders defaultMode={defaultMode}>
          <SiteHeader extraNavItems={headerNavItems} />
          {children}
          <SiteFooter extraNavItems={footerNavItems} />
        </AppProviders>
      </body>
    </html>
  );
}

export { SiteHeader, SiteFooter };
