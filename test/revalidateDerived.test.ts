// @vitest-environment node
//
// Pure tag derivation over config objects. No LMDB, no DOM, no server.

import { describe, expect, it } from "vitest";

import {
  derivedTagsOf,
  derivedTagsOfAll,
} from "@discontent/cms/content/next/revalidateDerived";
import type { AnyContentTypeConfig } from "@discontent/cms/content/types";

import { demoContentTypes } from "../packages/cms/demo/lib/contentTypes";
import { portfolioContentTypes } from "../websites/portfolio/editor/controller/contentTypes";
import { recipeContentTypes } from "../websites/recipe-website/editor/controller/contentTypes";
import { featuredRecipeContentConfig } from "../websites/recipe-website/common/controller/featuredRecipeContentConfig";
import { recipeContentConfig } from "../websites/recipe-website/common/controller/recipeContentConfig";

/*
 * F21b's safety property.
 *
 * The reset seat's job is to leave nothing cached from the previous fixture, so
 * replacing a hand-written list with a derivation may only *add* tags. A tag
 * that stopped firing would not fail loudly — it would make the suite
 * order-dependent, and surface later as an unrelated-looking flake on a
 * reshard. That is why the five tags the recipe route named before F21b are
 * pinned here as literal strings: they are the contract, and they are a floor.
 *
 * They are spelled out rather than imported from the cached-read modules on
 * purpose. Importing those would pull `unstable_cache` and the whole Next
 * runtime into a unit test, and would also make the assertion circular — both
 * sides would derive from the same helper, so a change to the tag *format*
 * would pass while silently invalidating every cache entry in existence.
 */
const RECIPE_ROUTE_BEFORE = [
  "pagination:recipes:by-date", // recipePages.tags.all
  "pagination:featured-recipes:by-date", // featuredRecipePages.tags.all
  "aggregate:recipes:tags", // recipeTagReads.tags.value
  "aggregate:recipes:by-tag", // recipeTagIndexReads.tags.value
  "item:recipes", // recipeItems.tags.all
];

describe("derivedTagsOf", () => {
  it("fires one tag per index, one per aggregate, and the item catch-all", () => {
    const config = {
      contentType: "notes",
      paginationIndexes: [{ name: "by-date" }, { name: "by-title" }],
      aggregates: [{ name: "tags" }],
    } as AnyContentTypeConfig;

    expect(derivedTagsOf(config)).toEqual([
      "pagination:notes:by-date",
      "pagination:notes:by-title",
      "aggregate:notes:tags",
      "item:notes",
    ]);
  });

  it("fires the item catch-all for a type that declares no derived state", () => {
    // The no-op case, and the reason it is sound: a repair seat is exactly what
    // the catch-all exists for, and a type with no cached item reads loses
    // nothing by expiring a tag no entry carries.
    const config = { contentType: "pages" } as AnyContentTypeConfig;

    expect(derivedTagsOf(config)).toEqual(["item:pages"]);
  });

  it("fires the index catch-all, not the per-page tags", () => {
    // `tags.all` is on every entry the keyspace produces, so one expiry covers
    // head, meta and every numbered page. The precise tags are the write path's.
    const config = {
      contentType: "notes",
      paginationIndexes: [{ name: "by-date" }],
    } as AnyContentTypeConfig;

    const tags = derivedTagsOf(config);
    expect(tags).toContain("pagination:notes:by-date");
    expect(tags.some((tag) => tag.includes(":page:"))).toBe(false);
    expect(tags).not.toContain("pagination:notes:by-date:meta");
    expect(tags).not.toContain("pagination:notes:by-date:head");
  });
});

describe("derivedTagsOfAll", () => {
  it("covers every tag the recipe route enumerated by hand", () => {
    const fired = derivedTagsOfAll(recipeContentTypes);

    for (const tag of RECIPE_ROUTE_BEFORE) {
      expect(fired).toContain(tag);
    }
  });

  it("adds only the item catch-alls the recipe route was missing", () => {
    const fired = derivedTagsOfAll(recipeContentTypes);

    expect(fired.filter((tag) => !RECIPE_ROUTE_BEFORE.includes(tag))).toEqual([
      "item:featured-recipes",
      "item:pages",
    ]);
  });

  it("fires only item catch-alls for portfolio, which declares no derived state", () => {
    // Portfolio's route expired nothing before F21b and was correct only
    // because of this. §11.2 is what makes that stop being true.
    expect(derivedTagsOfAll(portfolioContentTypes)).toEqual([
      "item:projects",
      "item:pages",
    ]);
  });

  it("reproduces the demo route's five tags exactly, adding and losing none", () => {
    // The demo is the one seat where the derivation is a *pure* simplification:
    // its hand-written list and the derived one are the same set, so adopting
    // it could not have changed behaviour. Pinned so it stays that way.
    expect(derivedTagsOfAll(demoContentTypes).sort()).toEqual(
      [
        "pagination:notes:by-date", // notePages.tags.all
        "aggregate:notes:tags", // noteTagReads.tags.value
        "item:notes", // noteItems.tags.all
        "pagination:bookmarks:by-date", // bookmarkPages.tags.all
        "item:bookmarks", // bookmarkItems.tags.all
      ].sort(),
    );
  });

  it("emits no duplicate tags", () => {
    const fired = derivedTagsOfAll(recipeContentTypes);
    expect(fired).toEqual([...new Set(fired)]);
  });
});

/*
 * F22b's property, and the reason it is a unit test.
 *
 * A rebuild seat's argument *is* its blast radius: it passes the configs it
 * moved, and `derivedTagsOf` turns that into tags. Two seats on recipe pass
 * deliberately different lists, and the difference is invisible to every e2e
 * test in the repo — over-invalidation has no symptom you can assert on a page,
 * because the page is simply correct either way, just recomputed. So the
 * narrowness of the featured seat is a claim only this file can keep honest.
 *
 * It is also the one property F22a proved e2e cannot reach at all. In
 * production the old `revalidatePath("/")` seat kept both the homepage and
 * `/recipe/shared` fresh, by some route Next's implicit tags do not explain —
 * so a browser cannot distinguish "fires the right tags" from "fires a path
 * call broad enough to cover it". Asserting the derivation directly can.
 */
describe("rebuild seats", () => {
  it("moves both keyspaces for a recipe rebuild, which cascades", () => {
    // `rebuildIndex` cascades to dependents by default (D1), so the recipe seat
    // in `actions/index.ts` really does move featured recipes too.
    expect(
      derivedTagsOfAll([recipeContentConfig, featuredRecipeContentConfig]),
    ).toEqual([
      "pagination:recipes:by-date",
      "aggregate:recipes:tags",
      "aggregate:recipes:by-tag",
      "item:recipes",
      "pagination:featured-recipes:by-date",
      "item:featured-recipes",
    ]);
  });

  it("covers every tag the recipe rebuild seat fired by hand", () => {
    // The floor, for the same reason `RECIPE_ROUTE_BEFORE` is one: a tag that
    // stopped firing would leave a rebuilt corpus serving pre-rebuild pages,
    // and would not fail loudly anywhere.
    const fired = derivedTagsOfAll([
      recipeContentConfig,
      featuredRecipeContentConfig,
    ]);

    for (const tag of RECIPE_ROUTE_BEFORE) {
      expect(fired).toContain(tag);
    }
  });

  it("fires no recipe tag for a featured-recipe rebuild", () => {
    // The narrow radius `rebuildFeaturedRecipeIndex`'s comment argues for, and
    // the assertion that makes the argument checkable. Recipe records and
    // recipe pages are untouched by a featured rebuild; widening this seat to
    // match its sibling would be the over-invalidation §6.4 exists to prevent.
    const fired = derivedTagsOf(featuredRecipeContentConfig);

    expect(fired).toEqual([
      "pagination:featured-recipes:by-date",
      "item:featured-recipes",
    ]);
    expect(fired).not.toContain("pagination:recipes:by-date");
    expect(fired).not.toContain("aggregate:recipes:tags");
    expect(fired).not.toContain("aggregate:recipes:by-tag");
    expect(fired).not.toContain("item:recipes");
  });

  it("fires nothing that exists for a portfolio export rebuild", () => {
    // `buildExport` rebuilds every type portfolio owns, so its list and the
    // registry are the same list — and both expand to item catch-alls no entry
    // carries. Correct today for the reason F21b's route was, and no longer
    // correct *by accident*: §11.2 declaring an index is what makes it fire.
    const fired = derivedTagsOfAll(portfolioContentTypes);

    expect(fired).toEqual(["item:projects", "item:pages"]);
    expect(fired.some((tag) => tag.startsWith("pagination:"))).toBe(false);
    expect(fired.some((tag) => tag.startsWith("aggregate:"))).toBe(false);
  });
});
