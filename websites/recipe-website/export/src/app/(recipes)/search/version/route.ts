import { stat } from "fs/promises";
import { resolve } from "path";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";

// Editor's version route is `force-dynamic` (re-stats the index per request);
// that directive is illegal under `output: "export"`. `force-static` is the
// required opt-in for a parameterless route handler in a static export: the
// `stat` runs at build time and the version string is baked into the static
// output — it only changes on a rebuild, which is exactly right for a static
// reader site (the client's IndexedDB-cached index re-populates whenever this
// string changes).
export const dynamic = "force-static";

export async function GET() {
  const dataFile = resolve(
    getContentDirectory(),
    recipeContentConfig.indexDirectory,
    "data.mdb",
  );
  try {
    const { mtimeMs, size } = await stat(dataFile);
    return Response.json({ version: `${mtimeMs}-${size}` });
  } catch {
    // Index not present at build time (ENOENT), or unreadable for any other
    // reason — no corpus, empty version. Returning here on *every* failure
    // matters: falling through without a Response left the baked-in route body
    // undefined, which the client's `res.json()` turns into a hard search error.
    return Response.json({ version: "" });
  }
}
