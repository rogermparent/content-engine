import { cache } from "react";
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

/**
 * Read the owner's settings, bypassing the per-request cache.
 *
 * This is the one server actions want. An action that reads, mutates and writes
 * shares a request scope with the re-render Next runs afterwards, so a cached
 * read taken *before* the write would hand that render the pre-write value.
 */
export async function readSettingsFresh(): Promise<Settings> {
  return readSettingsGeneric<Settings>();
}

/**
 * Read the owner's settings, once per request.
 *
 * `cache()` is not a nicety here: `(portfolio)/layout.tsx` and
 * `(portfolio)/page.tsx` both call this while rendering the same homepage, and
 * the settings store opens and closes its file on every call. React dedupes
 * them for the lifetime of one request; the next request gets a fresh cache.
 */
export const readSettings = cache(readSettingsFresh);

export async function writeSettings(settings: Settings): Promise<void> {
  return writeSettingsGeneric(settings);
}
