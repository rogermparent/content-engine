/**
 * Site-wide configuration shared by the editor and export apps.
 *
 * The title/description come from build-time env vars so both apps (and any
 * future deployment) can be branded without prop-drilling through layouts or
 * hardcoding strings in shared components. Falls back to neutral defaults.
 */
import { parseTheme, type Theme } from "@discontent/component-library/theming";

export interface SiteConfig {
  title: string;
  description: string;
}

const DEFAULT_TITLE = "Recipe Book";
const DEFAULT_DESCRIPTION = "A recipe book built with Next.js.";

export function getSiteConfig(): SiteConfig {
  return {
    title: process.env.NEXT_PUBLIC_SITE_TITLE || DEFAULT_TITLE,
    description:
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION || DEFAULT_DESCRIPTION,
  };
}

/**
 * The owner's baked-in site-default theme, read from the build-time `SITE_THEME`
 * env var (JSON of a Theme). The editor→export build injects it (see
 * exportAction). Non-`NEXT_PUBLIC_` so it's server/build-time only. Returns
 * `undefined` when absent or invalid, so the layout falls back to the built-in
 * default. Sync + env-only, mirroring `getSiteConfig`.
 */
export function getSiteTheme(): Theme | undefined {
  const raw = process.env.SITE_THEME;
  if (!raw) return undefined;
  return parseTheme(raw) ?? undefined;
}
