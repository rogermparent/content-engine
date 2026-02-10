"use server";

import { auth } from "@/auth";
import { writeSettings } from "@/settings";

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

  const ytdlpPath = formData.get("ytdlpPath");

  try {
    await writeSettings({
      ytdlpPath:
        typeof ytdlpPath === "string" && ytdlpPath ? ytdlpPath : undefined,
    });
    return { message: "Settings saved.", success: true };
  } catch {
    return { message: "Failed to save settings.", success: false };
  }
}
