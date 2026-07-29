import {
  getSettingsDirectory,
  readSettings as readSettingsGeneric,
  writeSettings as writeSettingsGeneric,
} from "@discontent/cms/settings";
import type { NamedPreset, Theme } from "@discontent/component-library/theming";
import type { ContactLinks } from "recipe-website-common/config/site";

/**
 * Recipe's owner settings.
 *
 * The store itself — where settings.json lives, and reading/writing it — was
 * promoted to `@discontent/cms/settings` when portfolio needed the same thing.
 * This file is now just recipe's *shape* bound to it. The shape stays per-site
 * because it is genuinely per-site: `ytdlpPath` is a recipe tool, and cms
 * cannot name `Theme` at all without a dependency cycle (component-library
 * already depends on cms).
 */
export interface Settings {
  ytdlpPath?: string;
  /** Owner-persisted site-default theme (see the theming engine). */
  theme?: Theme;
  /** Owner-saved named presets, editor-side only (not the built-in PRESETS). */
  presets?: NamedPreset[];
  /** Optional owner footer note, shown in the footer colophon (PR 13). */
  footerNote?: string;
  /** Owner social/contact links rendered in the footer brand block (PR 13). */
  contact?: ContactLinks;
}

export type { NamedPreset };

export { getSettingsDirectory };

export async function readSettings(): Promise<Settings> {
  return readSettingsGeneric<Settings>();
}

export async function writeSettings(settings: Settings): Promise<void> {
  return writeSettingsGeneric(settings);
}
