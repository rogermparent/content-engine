import { readJson, outputJSON } from "fs-extra";
import { resolve } from "path";
import type { Theme } from "@discontent/component-library/theming";

/** An owner-saved, named theme kept alongside the built-in PRESETS. */
export interface NamedPreset {
  id: string;
  name: string;
  theme: Theme;
}

export interface Settings {
  ytdlpPath?: string;
  /** Owner-persisted site-default theme (see the theming engine). */
  theme?: Theme;
  /** Owner-saved named presets, editor-side only (not the built-in PRESETS). */
  presets?: NamedPreset[];
}

export function getSettingsDirectory() {
  if (process.env.SETTINGS_DIRECTORY) return process.env.SETTINGS_DIRECTORY;
  if (process.env.TEST_MODE) return resolve("test-settings");
  return resolve("settings");
}

export async function readSettings(): Promise<Settings> {
  try {
    return await readJson(resolve(getSettingsDirectory(), "settings.json"));
  } catch {
    return {};
  }
}

export async function writeSettings(settings: Settings) {
  await outputJSON(resolve(getSettingsDirectory(), "settings.json"), settings, {
    spaces: 2,
  });
}
