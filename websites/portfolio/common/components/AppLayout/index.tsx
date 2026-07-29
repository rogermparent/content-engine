import Link from "next/link";
import { ComponentType, ReactNode } from "react";
import getMenuBySlug from "@discontent/menus-collection/controller/data/read";
import { MenuItem } from "@discontent/menus-collection/controller/types";
import { type Theme } from "@discontent/component-library/theming";
import { AppearanceMenu } from "@discontent/component-library/components/theming/Appearance";
import getProjects from "@discontent/projects-collection/controller/data/readIndex";
import { getSiteConfig } from "../../config/site";
import { PORTFOLIO_PRESETS } from "../../theme/presets";
import { ThemeShell } from "./ThemeShell";
import { CommandPaletteProvider } from "../CommandPalette";
import { PaletteTrigger } from "../CommandPalette/PaletteTrigger";

/**
 * Portfolio's masthead + footer.
 *
 * Replaces three overlapping chrome components (a SiteHeader, a SiteFooter
 * rendered by *both* the root and group layouts, and a separate settings
 * footer). One masthead, one footer.
 *
 * The design rule this armature exists to serve: personality lives here, not in
 * the content presentation. The masthead is where the wordmark, the mono
 * labels and the accent mark live, so the works themselves can be shown plainly
 * — untinted and unscrimmed. A gallery has architecture; the walls are white.
 */

const defaultHeaderItems: MenuItem[] = [
  { name: "Work", href: "/" },
  { name: "About", href: "/about" },
];

async function SiteMasthead({ extraNavItems }: { extraNavItems?: ReactNode }) {
  const headerMenu = await getMenuBySlug<MenuItem>("header");
  const headerItems = [...defaultHeaderItems, ...(headerMenu?.items || [])];
  const { title } = getSiteConfig();

  return (
    <header className="sticky top-0 z-40 h-[var(--header-height)] w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm font-display text-base font-semibold tracking-tight hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {/* The accent's one structural appearance in the chrome. Per the
              annotation-colour rule, accent marks — it never fills. */}
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[0.15rem] bg-primary"
          />
          {title}
        </Link>

        <nav className="flex items-center gap-1">
          {/* Plain <div>/<a> stack, deliberately not a <ul>: role="listitem"
              here would pollute unscoped getByRole("listitem") counts, which is
              the same trap documented in recipe's nav. */}
          {headerItems.map(({ href, name }) => (
            <Link
              key={href}
              href={href}
              className="rounded-sm px-2 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {name}
            </Link>
          ))}
          <PaletteTrigger />
          {extraNavItems}
          <AppearanceMenu presets={PORTFOLIO_PRESETS} className="ml-1" />
        </nav>
      </div>
    </header>
  );
}

function SiteFooter({ children }: { children?: ReactNode }) {
  const { title } = getSiteConfig();
  return (
    <footer className="mt-16 w-full border-t border-border print:hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {children}
      </div>
    </footer>
  );
}

export interface AppLayoutProps {
  children: ReactNode;
  /** Editor-only header extras (sign in/out, New Project). Absent in export. */
  extraNavItems?: ReactNode;
  /** Editor-only footer extras. */
  footerExtras?: ReactNode;
  /** Injected so `next-auth` stays out of `common/`, which export also builds. */
  AuthSlot?: ComponentType;
  /**
   * The owner's saved theme. The editor passes it so a theme change is visible
   * immediately; the export passes nothing and falls back to the baked
   * `SITE_THEME`, which is what a published site should read.
   */
  theme?: Theme;
}

/**
 * The shell both apps render.
 *
 * The theme is injected twice on purpose: an SSR <style> carrying the owner's
 * default so the first paint is already correct, and a blocking pre-paint script
 * that applies a *visitor's* saved override before paint. Without the script the
 * page paints the owner's theme and then flips.
 */
export async function AppLayout({
  children,
  extraNavItems,
  footerExtras,
  theme,
}: AppLayoutProps) {
  // The palette's corpus is read here, on the server, and handed down as a prop.
  // `/search/all` exists for a client that wants the index without the page, but
  // this layout already has the data — fetching it again would add a round trip,
  // a loading state and a failure mode for nothing.
  const { projects } = await getProjects();

  return (
    <ThemeShell theme={theme}>
      <CommandPaletteProvider projects={projects}>
        <SiteMasthead extraNavItems={extraNavItems} />
        <div className="flex w-full flex-1 flex-col">{children}</div>
        <SiteFooter>{footerExtras}</SiteFooter>
      </CommandPaletteProvider>
    </ThemeShell>
  );
}

export default AppLayout;
