// @vitest-environment node
//
// The rule every dynamic route in a static export has to obey, pinned once.
//
// `output: "export"` rejects a dynamic route whose `generateStaticParams` comes
// back **empty** — it raises "Page … is missing generateStaticParams()" for an
// empty array, not just for a missing function. So "the corpus has none of
// these" is not a quiet no-op that emits no pages; it fails the build outright.
//
// Three routes already carried a guard (`createPaginatedIndexRoute`,
// `createPaginatedJsonRoute`, `generateTagStaticParams`) and two did not. The
// two that did not were `/recipe/[slug]` and `/featured-recipe/[slug]`, and the
// second was reproducible rather than theoretical: building the export against
// the `search-corpus` fixture, which holds 67 recipes and no featured recipes,
// failed with
//
//   Error: Page "/featured-recipe/[slug]" is missing "generateStaticParams()"
//   so it cannot be used with "output: export" config.
//
// §12.3 recorded that as a latent defect ("it will bite whoever runs this check
// on a fresh corpus"); the Phase 0 spike ran into it. These tests are the
// red-before/green-after in a form that runs in a second rather than a build.

import { beforeEach, describe, expect, it, vi } from "vitest";

const readAllRecipeIds = vi.fn<() => Promise<string[]>>();
const readAllFeaturedRecipeIds = vi.fn<() => Promise<string[]>>();
const readTagIndex = vi.fn<() => Promise<Record<string, unknown> | null>>();

/*
 * Mocked at the data layer rather than stubbed at the LMDB layer: these modules
 * build cached readers at import time, and the question here is only what the
 * params function does with the list it is handed.
 */
vi.mock("recipe-website-common/controller/data/readRecipePages", () => ({
  readAllRecipeIds: () => readAllRecipeIds(),
  recipePages: {},
  default: {},
}));

vi.mock(
  "recipe-website-common/controller/data/readFeaturedRecipePages",
  () => ({
    readAllFeaturedRecipeIds: () => readAllFeaturedRecipeIds(),
    featuredRecipePages: {},
    default: {},
  }),
);

vi.mock("recipe-website-common/controller/data/readRecipeItem", () => ({
  recipeItems: { read: vi.fn() },
  default: {},
}));

vi.mock("recipe-website-common/controller/data/readRecipeTagIndex", () => ({
  recipeTagIndexReads: { read: () => readTagIndex() },
  default: {},
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a dynamic export route never emits zero params", () => {
  it("/recipe/[slug] emits a placeholder for a corpus with no recipes", async () => {
    readAllRecipeIds.mockResolvedValue([]);
    const { generateStaticParams } =
      await import("../websites/recipe-website/export/src/app/(recipes)/recipe/[slug]/page");
    const params = await generateStaticParams();
    expect(params).toHaveLength(1);
  });

  it("/recipe/[slug] emits one param per recipe otherwise", async () => {
    readAllRecipeIds.mockResolvedValue(["a", "b", "c"]);
    const { generateStaticParams } =
      await import("../websites/recipe-website/export/src/app/(recipes)/recipe/[slug]/page");
    expect(await generateStaticParams()).toEqual([
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
    ]);
  });

  /*
   * The one that actually broke a build. A content directory with recipes and
   * no featured recipes is an ordinary state — a new site, and `search-corpus`.
   */
  it("/featured-recipe/[slug] emits a placeholder when nothing is featured", async () => {
    readAllFeaturedRecipeIds.mockResolvedValue([]);
    const { generateStaticParams } =
      await import("../websites/recipe-website/export/src/app/(recipes)/featured-recipe/[slug]/page");
    const params = await generateStaticParams();
    expect(params).toHaveLength(1);
  });

  it("/featured-recipe/[slug] emits one param per feature otherwise", async () => {
    readAllFeaturedRecipeIds.mockResolvedValue(["x", "y"]);
    const { generateStaticParams } =
      await import("../websites/recipe-website/export/src/app/(recipes)/featured-recipe/[slug]/page");
    expect(await generateStaticParams()).toEqual([
      { slug: "x" },
      { slug: "y" },
    ]);
  });

  /* Already guarded before this pass — pinned so it stays that way. */
  it("/tags/[tag] emits a placeholder for a corpus with no tags", async () => {
    readTagIndex.mockResolvedValue({});
    const { generateTagStaticParams } =
      await import("../websites/recipe-website/common/components/TagPage/routes");
    expect(await generateTagStaticParams()).toEqual([{ tag: "_" }]);
  });
});
