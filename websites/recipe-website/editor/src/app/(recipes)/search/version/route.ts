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
  } catch (e: Error | unknown) {
    if (e instanceof Error) {
      if ("code" in e && e.code === "ENOENT") {
        // Index not present, return null
        return Response.json(
          { version: "" },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }
  }
}
