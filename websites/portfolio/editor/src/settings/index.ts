import {
  getSettingsDirectory,
  readSettings as readSettingsGeneric,
  writeSettings as writeSettingsGeneric,
} from "@discontent/cms/settings";
import type { NamedPreset, Theme } from "@discontent/component-library/theming";
import type { Posture } from "portfolio-website-common/config/site";

/**
 * Portfolio's owner settings.
 *
 * The store lives in `@discontent/cms/settings`; this is just portfolio's shape
 * bound to it. Note what is *not* here: `ytdlpPath`, which was the only
 * recipe-specific field in the module this was promoted from.
 *
 * `posture` is the one addition. Until now `SITE_LAYOUT` was read-only, so the
 * owner could not change posture without editing the environment — which made
 * the three postures a developer feature rather than a site feature.
 */
export interface Settings {
  /** Owner-persisted site-default theme (see the theming engine). */
  theme?: Theme;
  /** Owner-saved named presets, editor-side only (not PORTFOLIO_PRESETS). */
  presets?: NamedPreset[];
  /** Which layout posture the site renders in. Baked into the export. */
  posture?: Posture;
  /** The statement above the index — two lines at most. */
  statement?: string;
  /** The wordmark. */
  title?: string;
  description?: string;
  /**
   * Owner contact links, rendered in the footer.
   *
   * This is where `homepage.json`'s `contactLinks` landed — deliberately without
   * its `icon`/`iconType` fields. Those were the whole vulnerability: the icon
   * name was a form-supplied value that `ContactSection` passed to
   * `readFile(join(contentDirectory, "icons", icon))` and then injected with
   * `dangerouslySetInnerHTML`. That is an arbitrary file read *and* a stored-XSS
   * sink in one expression (an SVG can carry a `<script>`), so the field does not
   * come back.
   */
  contactLinks?: ContactLink[];
}

export interface ContactLink {
  label: string;
  url: string;
}

export type { NamedPreset };

export { getSettingsDirectory };

export async function readSettings(): Promise<Settings> {
  return readSettingsGeneric<Settings>();
}

export async function writeSettings(settings: Settings): Promise<void> {
  return writeSettingsGeneric(settings);
}
