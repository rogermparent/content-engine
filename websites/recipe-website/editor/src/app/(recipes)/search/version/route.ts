import { stat } from "fs/promises";
import { resolve } from "path";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const dataFile = resolve(
    getContentDirectory(),
    recipeContentConfig.indexDirectory,
    "data.mdb",
  );
  try {
    const { mtimeMs, size } = await stat(dataFile);
    return Response.json(
      { version: `${mtimeMs}-${size}` },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Index not present (ENOENT), or unreadable for any other reason: either
    // way there is no version to report. Falling through without a Response —
    // as this handler used to on the non-ENOENT path — makes the client's
    // `res.json()` throw and takes the whole search UI into its error state.
    return Response.json(
      { version: "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
