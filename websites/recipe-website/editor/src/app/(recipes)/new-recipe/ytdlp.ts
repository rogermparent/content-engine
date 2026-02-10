import { execa } from "execa";
import { readSettings } from "@/settings";

interface YtdlpMetadata {
  title: string;
  description: string;
  thumbnail: string;
  webpage_url: string;
  duration: number;
  channel: string;
}

export type YtdlpResult =
  | { status: "success"; metadata: YtdlpMetadata }
  | { status: "not-found" }
  | { status: "error"; message: string };

export async function fetchYtdlpMetadata(url: string): Promise<YtdlpResult> {
  try {
    const settings = await readSettings();
    const binary = settings.ytdlpPath || "yt-dlp";
    const { stdout } = await execa(binary, ["-J", url], {
      timeout: 30_000,
    });
    const data = JSON.parse(stdout);
    return {
      status: "success",
      metadata: {
        title: data.title ?? "",
        description: data.description ?? "",
        thumbnail: data.thumbnail ?? "",
        webpage_url: data.webpage_url ?? url,
        duration: data.duration ?? 0,
        channel: data.channel ?? "",
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { status: "not-found" };
    }
    const message =
      error instanceof Error ? error.message : "Unknown yt-dlp error";
    return { status: "error", message };
  }
}
