/**
 * Bring every Playwright content fixture's derived indexes into step.
 *
 * A fixture is a content directory captured on disk, LMDB files and all, and a
 * suite restores one by copying it over the live content directory. Nothing
 * about a read self-heals what it finds — by design, since a read may be
 * happening inside a static export or against a read-only mount — so a fixture
 * generated before a content type declared an index serves an empty list with
 * no error, and one generated before an index value grew a field serves the old
 * shape.
 *
 * Adding an index to a content type, adding an aggregate, or changing what its
 * index value carries therefore means regenerating every existing fixture. Run
 * this after any of them; regenerating fixtures through the UI would work too,
 * but it rewrites content files that were fine.
 *
 * Generic over a site's registry (F21c). Each site's script was bespoke — recipe
 * had a hand-written two-branch walk, and portfolio had none at all, so the
 * moment `projects` declares an index every portfolio fixture would have served
 * an empty list with nothing going red. That is what made §11.2's adoption
 * unsafe, and it is the last of F21's three hand-maintained copies.
 */
import { pathExists, readdir } from "fs-extra";
import { resolve } from "path";
import { updateAggregates } from "../aggregates/updateAggregates";
import { updatePaginationIndexes } from "../pagination/updatePaginationIndexes";
import { rebuildIndex } from "./rebuildIndex";
import type { AnyContentTypeConfig } from "./types";

export interface RebuildFixtureIndexesOptions {
  /** Every content type the site owns — its `contentTypes.ts` registry. */
  configs: readonly AnyContentTypeConfig[];
  /** Directory whose immediate subdirectories are each a content fixture. */
  fixturesDir: string;
  /** Where to report progress. Defaults to `console.log`. */
  log?: (message: string) => void;
}

/**
 * Bring one content type's derived state in one fixture up to date.
 *
 * Two paths, and which one applies is read off the config rather than hardcoded:
 *
 * - A type that **borrows index-value fields** (§6.1) needs its content index
 *   rewritten, not just its keyspace. Materializing borrowed fields means
 *   resolving the reference per item, which is `rebuildIndex` — and the content
 *   index carries no spec hash, so nothing would ever notice those copies are
 *   absent and nothing self-heals. `rebuildIndex` forces `updatePaginationIndexes`
 *   internally, so the one call covers both. `cascadeDependents` is off because
 *   the caller walks every config in the registry anyway; letting each rebuild
 *   cascade would rebuild shared types once per dependent.
 * - Everything else needs only its derived kinds recomputed. `force` is set on
 *   the pagination pass because a fixture's content index was written directly
 *   rather than through the write path, which is precisely the case meta cannot
 *   detect. No `force` on aggregates — that pass re-reads the corpus every time
 *   and has nothing to distrust.
 */
async function rebuildOne(
  config: AnyContentTypeConfig,
  contentDirectory: string,
  fixtureName: string,
  log: (message: string) => void,
): Promise<void> {
  /*
   * Absent from this fixture — a page-only fixture holds no recipes, and a
   * portfolio fixture may hold no projects.
   *
   * The guard is on the *index directory* and it is load-bearing, not an
   * optimisation: `getContentDatabase` creates what it opens, so indexing a
   * type a fixture does not have would leave a new LMDB environment inside the
   * captured directory. That is the D2a trap (§10) in the one place where the
   * side effect gets committed to the repository rather than merely observed.
   */
  if (!(await pathExists(resolve(contentDirectory, config.indexDirectory)))) {
    log(`${fixtureName}: no ${config.contentType} index, skipped`);
    return;
  }

  /*
   * `references`, the *inbound* half of the edge — the fields this type copies
   * out of another. Not `borrowedFieldsOf`, which reads `referencedBy` and
   * answers the outbound question, "which of my fields do others borrow": that
   * is true of recipes and false of featured recipes, which is exactly
   * backwards for deciding who needs their content index rewritten.
   */
  if ((config.references ?? []).length > 0) {
    await rebuildIndex({
      config,
      contentDirectory,
      cascadeDependents: false,
    });
    log(`${fixtureName}: ${config.contentType} index rebuilt`);
    return;
  }

  for (const result of await updatePaginationIndexes({
    config,
    contentDirectory,
    force: true,
  })) {
    log(
      `${fixtureName}: ${config.contentType} ${result.name} → ${result.total} items, headPage ${result.headPage}`,
    );
  }

  for (const result of await updateAggregates({ config, contentDirectory })) {
    log(
      `${fixtureName}: ${config.contentType} aggregate ${result.name} → folded ${result.total} items`,
    );
  }
}

/**
 * Every fixture, every content type.
 *
 * @example
 * ```ts
 * await rebuildFixtureIndexes({
 *   configs: recipeContentTypes,
 *   fixturesDir: resolve(__dirname, "..", "playwright", "fixtures", "test-content"),
 * });
 * ```
 */
export async function rebuildFixtureIndexes({
  configs,
  fixturesDir,
  log = console.log,
}: RebuildFixtureIndexesOptions): Promise<void> {
  const entries = await readdir(fixturesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const contentDirectory = resolve(fixturesDir, entry.name);

    /*
     * Sequential across configs, because a type that borrows fields reads the
     * type it borrows from. Running the registry in order means a referenced
     * type is already current when its dependent resolves against it — which is
     * why a registry lists its types in dependency order, referenced first.
     */
    for (const config of configs) {
      await rebuildOne(config, contentDirectory, entry.name, log);
    }
  }
}

export default rebuildFixtureIndexes;
