import { execa } from "execa";

interface YtdlpMetadata {
  title: string;
  description: string;
  thumbnail: string;
  webpage_url: string;
  duration: number;
  channel: string;
}

export async function fetchYtdlpMetadata(
  url: string,
): Promise<YtdlpMetadata | null> {
  try {
    const { stdout } = await execa("yt-dlp", ["-J", url], {
      timeout: 30_000,
    });
    const data = JSON.parse(stdout);
    return {
      title: data.title ?? "",
      description: data.description ?? "",
      thumbnail: data.thumbnail ?? "",
      webpage_url: data.webpage_url ?? url,
      duration: data.duration ?? 0,
      channel: data.channel ?? "",
    };
  } catch {
    return null;
  }
}
