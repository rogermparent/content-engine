"use server";

import { revalidatePath } from "next/cache";
import { parseTheme } from "@discontent/component-library/theming";
import { auth } from "@/auth";
import { readSettings, writeSettings, type Settings } from "@/settings";

export interface SettingsActionState {
  message: string;
  success: boolean;
}

export async function updateSettings(
  _previousState: SettingsActionState | null,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await auth();
  if (!session?.user?.email) {
    return { message: "Authentication required", success: false };
  }

  // Merge onto existing settings: a given form only submits its own fields, so
  // we preserve every field it doesn't carry (e.g. the Tools form leaves the
  // saved theme untouched, and the Theme editor leaves ytdlpPath untouched).
  const existing = await readSettings();
  const next: Settings = { ...existing };

  if (formData.has("ytdlpPath")) {
    const ytdlpPath = formData.get("ytdlpPath");
    next.ytdlpPath =
      typeof ytdlpPath === "string" && ytdlpPath ? ytdlpPath : undefined;
  }

  if (formData.has("theme")) {
    const raw = formData.get("theme");
    const parsed = typeof raw === "string" ? parseTheme(raw) : null;
    if (typeof raw === "string" && raw && !parsed) {
      return { message: "Invalid theme data.", success: false };
    }
    next.theme = parsed ?? undefined;
  }

  try {
    await writeSettings(next);
    // The site default is injected in the root layout, so refresh every route.
    revalidatePath("/", "layout");
    return { message: "Settings saved.", success: true };
  } catch {
    return { message: "Failed to save settings.", success: false };
  }
}
