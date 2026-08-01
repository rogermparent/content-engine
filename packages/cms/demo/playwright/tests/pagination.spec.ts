import type { Page } from "@playwright/test";
import { test, expect } from "../support/test";

/*
 * The `many-notes` fixture is 14 notes dated 2024-01-01 … 2024-01-14, titled
 * "Note 01" … "Note 14". At `perPage: 4` that lays out as:
 *
 *   page 0: note-01..04   page 1: note-05..08   page 2: note-09..12
 *   page 3: note-13,14  ← head, partial
 *
 * so `headPage` is 3, the landing folds pages 3 and 2 into six items, and the
 * numbered routes are exactly [0, 1].
 */
const INDEX = "notes/by-date";

async function titles(page: Page): Promise<string[]> {
  return page.getByTestId("browse-list").getByRole("listitem").allInnerTexts();
}

async function slugs(page: Page): Promise<string[]> {
  const links = await page.getByTestId("browse-list").getByRole("link").all();
  const result: string[] = [];
  for (const link of links) {
    result.push(
      ((await link.getAttribute("href")) ?? "").replace("/notes/", ""),
    );
  }
  return result;
}

async function listHtml(page: Page): Promise<string> {
  return page.getByTestId("browse-list").innerHTML();
}

test.describe("Pagination Indexes", () => {
  test.beforeEach(async ({ resetData, clearPaginationChanges }) => {
    await resetData("many-notes");
    /*
     * After the reset, not before: the artifact is a dotfile inside the
     * content directory and `copyFixtures` copied the whole directory, so the
     * fixture carries whatever the generator's last write recorded.
     */
    await clearPaginationChanges();
  });

  test.describe("Layout", () => {
    test("landing folds the head with the page below it", async ({ page }) => {
      await page.goto("/notes/browse");
      expect(await slugs(page)).toEqual([
        "note-14",
        "note-13",
        "note-12",
        "note-11",
        "note-10",
        "note-09",
      ]);
      await expect(page.getByText("Total notes: 14")).toBeVisible();
    });

    test("numbered pages hold exactly perPage items, newest first", async ({
      page,
    }) => {
      await page.goto("/notes/browse/1");
      expect(await slugs(page)).toEqual([
        "note-08",
        "note-07",
        "note-06",
        "note-05",
      ]);

      await page.goto("/notes/browse/0");
      expect(await slugs(page)).toEqual([
        "note-04",
        "note-03",
        "note-02",
        "note-01",
      ]);
    });

    test("the landing and the numbered routes cover the corpus exactly once", async ({
      page,
    }) => {
      const seen: string[] = [];
      for (const path of [
        "/notes/browse",
        "/notes/browse/1",
        "/notes/browse/0",
      ]) {
        await page.goto(path);
        seen.push(...(await slugs(page)));
      }
      expect(seen).toHaveLength(14);
      expect(new Set(seen).size).toBe(14);
    });

    test("does not serve the head or the folded page as numbered routes", async ({
      request,
    }) => {
      // headPage is 3 and page 2 is folded into the landing.
      expect((await request.get("/notes/browse/2")).status()).toBe(404);
      expect((await request.get("/notes/browse/3")).status()).toBe(404);
      expect((await request.get("/notes/browse/99")).status()).toBe(404);
    });

    test("navigates from the landing back through the older pages", async ({
      page,
    }) => {
      await page.goto("/notes/browse");
      await page.getByRole("link", { name: "Older notes" }).click();
      await expect(page).toHaveURL(/\/notes\/browse\/1$/);

      await page.getByRole("link", { name: "Older notes" }).click();
      await expect(page).toHaveURL(/\/notes\/browse\/0$/);
      await expect(page.getByRole("link", { name: "Older notes" })).toHaveCount(
        0,
      );

      await page.getByRole("link", { name: "Newer notes" }).click();
      await expect(page).toHaveURL(/\/notes\/browse\/1$/);
      await page.getByRole("link", { name: "Newer notes" }).click();
      await expect(page).toHaveURL(/\/notes\/browse$/);
    });
  });

  test.describe("The thesis: a create dirties only the head", () => {
    test("reports one dirty page and leaves every sealed page byte-identical", async ({
      page,
      readPaginationChanges,
    }) => {
      await page.goto("/notes/browse/0");
      const pageZeroBefore = await listHtml(page);
      await page.goto("/notes/browse/1");
      const pageOneBefore = await listHtml(page);

      await page.goto("/notes/new");
      await page.getByLabel("Title *").fill("Note 15");
      await page.getByLabel(/Slug/).fill("note-15");
      await page.getByLabel(/Date/).fill("2024-01-15T00:00");
      await page.getByRole("button", { name: "Create Note" }).click();
      await expect(
        page.getByRole("heading", { name: "Note 15" }),
      ).toBeVisible();

      // This is the whole point of anchoring pages at the stable end.
      const changes = await readPaginationChanges();
      expect(changes[INDEX]).toMatchObject({
        dirtyPages: [3],
        removedPages: [],
        headPage: 3,
        total: 15,
      });

      await page.goto("/notes/browse/0");
      expect(await listHtml(page)).toBe(pageZeroBefore);
      await page.goto("/notes/browse/1");
      expect(await listHtml(page)).toBe(pageOneBefore);

      // The landing is the one surface that did change.
      await page.goto("/notes/browse");
      expect(await slugs(page)).toEqual([
        "note-15",
        "note-14",
        "note-13",
        "note-12",
        "note-11",
        "note-10",
        "note-09",
      ]);
    });
  });

  test.describe("Edits", () => {
    test("an edit dirties only the page the item is on", async ({
      page,
      readPaginationChanges,
    }) => {
      await page.goto("/notes/note-02/edit");
      await page.getByLabel("Title *").clear();
      await page.getByLabel("Title *").fill("Note 02 Edited");
      await page.getByRole("button", { name: "Update Note" }).click();
      await expect(
        page.getByRole("heading", { name: "Note 02 Edited" }),
      ).toBeVisible();

      const changes = await readPaginationChanges();
      expect(changes[INDEX]).toMatchObject({
        dirtyPages: [0],
        removedPages: [],
        headPage: 3,
        total: 14,
      });

      await page.goto("/notes/browse/0");
      expect(await titles(page)).toEqual(
        expect.arrayContaining([expect.stringContaining("Note 02 Edited")]),
      );
    });

    test("a rename moves the item without orphaning or duplicating it", async ({
      page,
      readPaginationChanges,
    }) => {
      await page.goto("/notes/note-03/edit");
      await page.getByLabel(/Slug/).clear();
      await page.getByLabel(/Slug/).fill("note-03-renamed");
      await page.getByRole("button", { name: "Update Note" }).click();
      await expect(page).toHaveURL(/\/notes\/note-03-renamed$/);

      // Same date, so the same rank and the same page — only the id moved.
      const changes = await readPaginationChanges();
      expect(changes[INDEX]).toMatchObject({
        dirtyPages: [0],
        removedPages: [],
        total: 14,
      });

      await page.goto("/notes/browse/0");
      expect(await slugs(page)).toEqual([
        "note-04",
        "note-03-renamed",
        "note-02",
        "note-01",
      ]);

      const seen: string[] = [];
      for (const path of [
        "/notes/browse",
        "/notes/browse/1",
        "/notes/browse/0",
      ]) {
        await page.goto(path);
        seen.push(...(await slugs(page)));
      }
      expect(new Set(seen).size).toBe(14);
      expect(seen).not.toContain("note-03");
    });
  });

  test.describe("Deletes", () => {
    test("deleting old notes shifts later pages and collapses the head", async ({
      page,
      readPaginationChanges,
      clearPaginationChanges,
    }) => {
      /*
       * A delete near the oldest end is the expensive write: every position
       * after it shifts, so it dirties from its own page through the head —
       * and nothing older.
       */
      await page.goto("/notes/note-01/delete");
      await page.getByRole("button", { name: "Yes, Delete Note" }).click();
      await expect(page.getByText("Create New Note")).toBeVisible();

      let changes = await readPaginationChanges();
      expect(changes[INDEX]).toMatchObject({
        dirtyPages: [0, 1, 2, 3],
        removedPages: [],
        headPage: 3,
        total: 13,
      });

      await clearPaginationChanges();

      // 13 -> 12 items leaves no head page 3 at all.
      await page.goto("/notes/note-02/delete");
      await page.getByRole("button", { name: "Yes, Delete Note" }).click();
      await expect(page.getByText("Create New Note")).toBeVisible();

      changes = await readPaginationChanges();
      expect(changes[INDEX]).toMatchObject({
        dirtyPages: [0, 1, 2],
        removedPages: [3],
        headPage: 2,
        total: 12,
      });

      // The numbered routes shrank with it.
      await page.goto("/notes/browse");
      expect(await slugs(page)).toEqual([
        "note-14",
        "note-13",
        "note-12",
        "note-11",
        "note-10",
        "note-09",
        "note-08",
        "note-07",
      ]);

      await page.goto("/notes/browse/0");
      expect(await slugs(page)).toEqual([
        "note-06",
        "note-05",
        "note-04",
        "note-03",
      ]);
    });
  });

  test.describe("The artifact", () => {
    test("accumulates dirty pages across writes until it is cleared", async ({
      page,
      readPaginationChanges,
      clearPaginationChanges,
    }) => {
      // An edit deep in the corpus…
      await page.goto("/notes/note-02/edit");
      await page.getByLabel("Title *").clear();
      await page.getByLabel("Title *").fill("Note 02 Merged");
      await page.getByRole("button", { name: "Update Note" }).click();
      await expect(
        page.getByRole("heading", { name: "Note 02 Merged" }),
      ).toBeVisible();

      // …then one at the newest end, with no build in between.
      await page.goto("/notes/new");
      await page.getByLabel("Title *").fill("Note 16");
      await page.getByLabel(/Slug/).fill("note-16");
      await page.getByLabel(/Date/).fill("2024-01-16T00:00");
      await page.getByRole("button", { name: "Create Note" }).click();
      await expect(
        page.getByRole("heading", { name: "Note 16" }),
      ).toBeVisible();

      const changes = await readPaginationChanges();
      expect(changes[INDEX].dirtyPages).toEqual([0, 3]);
      expect(changes[INDEX].total).toBe(15);

      await clearPaginationChanges();
      expect(await readPaginationChanges()).toEqual({});
    });
  });

  test.describe("Content types without indexes", () => {
    test("bookmarks take the write path without gaining an index", async ({
      page,
      readPaginationChanges,
      clearPaginationChanges,
    }) => {
      await clearPaginationChanges();

      await page.goto("/notes/note-05");
      await page.getByRole("link", { name: "Bookmark" }).click();
      await page.getByLabel("Label *").fill("Unpaginated Bookmark");
      await page.getByRole("button", { name: "Create Bookmark" }).click();
      await expect(
        page.getByRole("heading", { name: "Unpaginated Bookmark" }),
      ).toBeVisible();

      // No indexes declared means no work done and nothing recorded.
      expect(await readPaginationChanges()).toEqual({});
    });
  });
});
