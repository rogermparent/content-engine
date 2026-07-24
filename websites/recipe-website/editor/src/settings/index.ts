import { readJson, outputJSON } from "fs-extra";
import { resolve } from "path";
import type { Theme } from "@discontent/component-library/theming";

export interface Settings {
  ytdlpPath?: string;
  /** Owner-persisted site-default theme (see the theming engine). */
  theme?: Theme;
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
