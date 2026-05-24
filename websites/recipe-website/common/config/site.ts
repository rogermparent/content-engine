/**
 * Site-wide configuration shared by the editor and export apps.
 *
 * The title/description come from build-time env vars so both apps (and any
 * future deployment) can be branded without prop-drilling through layouts or
 * hardcoding strings in shared components. Falls back to neutral defaults.
 */
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
