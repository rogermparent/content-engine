import {
  ImportedRecipe,
  importRecipeData,
} from "recipe-website-common/util/importRecipeData";
import { fetchYtdlpMetadata } from "./ytdlp";

export interface RecipeActionState {
  url?: string;
  message?: string;
  error?: Error;
  recipe?: Partial<ImportedRecipe>;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname.includes("youtube.com") || hostname.includes("youtu.be");
  } catch {
    return false;
  }
}

function formatYouTubeDescription(
  url: string,
  description?: string,
  channel?: string,
): string {
  const segments = [`*Imported from [${url}](${url})*`];
  if (channel) {
    segments.push(`\n\nChannel: ${channel}`);
  }
  if (description) {
    segments.push(`\n\n---\n\n${description}`);
  }
  return segments.join("");
}

export async function reduceRecipeImport(
  _state: RecipeActionState | null,
  url: string | null,
) {
  if (!url) {
    return { message: "No URL provided" };
  }
  try {
    if (typeof url === "string") {
      if (isYouTubeUrl(url)) {
        const result = await fetchYtdlpMetadata(url);
        if (result.status === "success") {
          const { metadata } = result;
          return {
            url,
            recipe: {
              name: metadata.title,
              description: formatYouTubeDescription(
                url,
                metadata.description,
                metadata.channel,
              ),
              videoImportUrl: metadata.webpage_url,
              imageImportUrl: metadata.thumbnail,
            } as Partial<ImportedRecipe>,
          };
        }
        const message =
          result.status === "not-found"
            ? "yt-dlp binary was not found. Please check your settings."
            : `yt-dlp error: ${result.message}`;
        return {
          url,
          message,
          recipe: await importRecipeData(url),
        };
      }
      return { recipe: await importRecipeData(url), url };
    } else {
      return { message: "Invalid URL provided" };
    }
  } catch (e: unknown) {
    const message = typeof e === "string" ? e : (e as Error)?.message;
    if (message) {
      return { message };
    }
    return { message: "Unknown error occurred!" };
  }
}
