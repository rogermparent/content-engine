import { readJson, outputJSON } from "fs-extra";
import { resolve } from "path";

export interface Settings {
  ytdlpPath?: string;
}

export function getSettingsDirectory() {
  return process.env.SETTINGS_DIRECTORY || resolve("settings");
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
