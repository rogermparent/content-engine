/*
 * Bring every Playwright content fixture's derived indexes into step.
 *
 *   pnpm tsx scripts/build-fixture-indexes.ts
 *
 * Run this after adding an index to a content type, adding an aggregate, or
 * changing what a type's index value carries — see `rebuildFixtureIndexes` for
 * why none of those self-heal.
 *
 * The two branches this used to spell out are gone (F21c). They were a
 * hand-written statement of what the configs already declare: recipes needed
 * `updatePaginationIndexes` + `updateAggregates`, featured recipes needed
 * `rebuildIndex` because they borrow `name` and `image` (§6.1). The engine now
 * reads that off `references` per config, so this script names the registry and
 * the fixtures directory and nothing else — and `pages`, which the old branches
 * simply did not cover, is included for free.
 */
import { resolve } from "node:path";
import { rebuildFixtureIndexes } from "@discontent/cms/content/rebuildFixtureIndexes";
import { recipeContentTypes } from "../controller/contentTypes";

rebuildFixtureIndexes({
  configs: recipeContentTypes,
  fixturesDir: resolve(
    __dirname,
    "..",
    "playwright",
    "fixtures",
    "test-content",
  ),
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
