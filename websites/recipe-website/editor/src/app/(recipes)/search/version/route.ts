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
  const { mtimeMs, size } = await stat(dataFile);
  return Response.json(
    { version: `${mtimeMs}-${size}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
