/*
 * Bring every Playwright content fixture's derived indexes into step.
 *
 * A fixture is a content directory captured on disk, LMDB files and all, and
 * the suite restores one by copying it over `test-content`. Nothing about a
 * read self-heals what it finds — by design, since a read may be happening
 * inside a static export or against a read-only mount — so a fixture generated
 * before a content type declared an index serves an empty list with no error,
 * and one generated before an index value grew a field serves the old shape.
 * Same failure `seed-pages.ts` documents for the page index.
 *
 * Adding an index to a content type, adding an aggregate, or changing what its
 * index value carries therefore means regenerating every existing fixture. Run
 * this after any of them; regenerating the fixtures through the UI would work
 * too, but it rewrites content files that were fine.
 *
 *   pnpm tsx scripts/build-fixture-indexes.ts
 *
 * Two branches, because the two content types need different things:
 *
 * - **recipes** own a pagination keyspace and an unchanged index shape, so
 *   `updatePaginationIndexes` is enough. `force` is set because a fixture's
 *   content index was written directly rather than through the write path,
 *   which is precisely the case meta cannot detect (see
 *   `UpdatePaginationIndexOptions`). Since F10c they also own a tag aggregate,
 *   which `updateAggregates` folds in the same pass — no `force` there, because
 *   that pass re-reads the corpus every time and has nothing to distrust.
 * - **featured recipes** own a keyspace *and* borrow `name` and `image` from
 *   the recipe they point at (§6.1), and the content index carries no spec
 *   hash to notice those copies are absent. Materializing them means resolving
 *   the reference per item, which is `rebuildIndex` — and `rebuildIndex`
 *   forces `updatePaginationIndexes` internally, so the one call covers both.
 *   `cascadeDependents` is off: recipes are this type's dependency, not its
 *   dependent, and the branch above has already dealt with them.
 */
import { readdir, pathExists } from "fs-extra";
import { resolve } from "node:path";
import { updateAggregates } from "@discontent/cms/aggregates/updateAggregates";
import { rebuildIndex } from "@discontent/cms/content/rebuildIndex";
import { updatePaginationIndexes } from "@discontent/cms/pagination/updatePaginationIndexes";
import { featuredRecipeContentConfig } from "recipe-website-common/controller/featuredRecipeContentConfig";
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
    if (await pathExists(resolve(contentDirectory, "recipes", "index"))) {
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

      const aggregates = await updateAggregates({
        config: recipeContentConfig,
        contentDirectory,
      });
      for (const result of aggregates) {
        console.log(
          `${entry.name}: aggregate ${result.name} → folded ${result.total} items`,
        );
      }
    } else {
      console.log(`${entry.name}: no recipe index, skipped`);
    }

    if (
      await pathExists(resolve(contentDirectory, "featured-recipes", "index"))
    ) {
      await rebuildIndex({
        config: featuredRecipeContentConfig,
        contentDirectory,
        cascadeDependents: false,
      });
      console.log(`${entry.name}: featured-recipes index rebuilt`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
