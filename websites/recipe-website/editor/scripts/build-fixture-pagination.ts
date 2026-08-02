/*
 * Build the pagination keyspace for every Playwright content fixture.
 *
 * A fixture is a content directory captured on disk, LMDB files and all, and
 * the suite restores one by copying it over `test-content`. Reads do not
 * self-heal an unbuilt pagination index — by design, since a read may be
 * happening inside a static export or against a read-only mount — so a fixture
 * generated before a content type declared an index serves an empty list with
 * no error. Same failure `seed-pages.ts` documents for the page index.
 *
 * Adding an index to a content type therefore means bringing every existing
 * fixture into step, exactly as `recipes/index` already is. Run this after
 * adding or changing a `paginationIndexes` entry; regenerating the fixtures
 * through the UI would work too, but it rewrites content files that were fine.
 *
 *   pnpm tsx scripts/build-fixture-pagination.ts
 *
 * `force` is set because a fixture's content index was written directly rather
 * than through the write path, which is precisely the case meta cannot detect
 * (see `UpdatePaginationIndexOptions`).
 */
import { readdir, pathExists } from "fs-extra";
import { resolve } from "node:path";
import { updatePaginationIndexes } from "@discontent/cms/pagination/updatePaginationIndexes";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";

const FIXTURE_ROOT = resolve(
  __dirname,
  "..",
  "playwright",
  "fixtures",
  "test-content",
);

async function main() {
  const entries = await readdir(FIXTURE_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const contentDirectory = resolve(FIXTURE_ROOT, entry.name);

    // Page-only fixtures hold no recipes and so have nothing to index.
    if (!(await pathExists(resolve(contentDirectory, "recipes", "index")))) {
      console.log(`${entry.name}: no recipe index, skipped`);
      continue;
    }

    const results = await updatePaginationIndexes({
      config: recipeContentConfig,
      contentDirectory,
      force: true,
    });

    for (const result of results) {
      console.log(
        `${entry.name}: ${result.name} → ${result.total} items, headPage ${result.headPage}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
