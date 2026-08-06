/*
 * Bring every Playwright content fixture's derived indexes into step.
 *
 *   pnpm tsx scripts/build-fixture-indexes.ts
 *
 * Portfolio's first (F21c). It is a no-op today — neither `projects` nor
 * `pages` declares a pagination index or an aggregate, so every fixture is
 * already current — and that is exactly why it exists now rather than later.
 *
 * Without it, the PR that gives `projects` an index would leave every captured
 * fixture serving an empty list, with **nothing going red**: a read does not
 * self-heal what it finds, and an absent index is indistinguishable from an
 * empty corpus. Recipe learned that the expensive way, which is what
 * `rebuildFixtureIndexes` documents. Having the script in place before the
 * adoption means that PR is a config line and a run of this.
 */
import { resolve } from "node:path";
import { rebuildFixtureIndexes } from "@discontent/cms/content/rebuildFixtureIndexes";
import { portfolioContentTypes } from "../controller/contentTypes";

rebuildFixtureIndexes({
  configs: portfolioContentTypes,
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
