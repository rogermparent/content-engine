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
