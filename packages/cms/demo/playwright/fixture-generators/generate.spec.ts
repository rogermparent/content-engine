/**
 * Fixture Generation Spec
 *
 * Generates the test fixtures used by other tests.
 * Run explicitly with `pnpm generate-fixtures`; not part of the normal suite.
 */

import { test, expect } from "../support/test";
import { checkNoteTitlesInOrder } from "../support/helpers";

test.describe("Fixture Generation", () => {
  test.describe("one-note fixture", () => {
    test("generates one-note fixture", async ({
      page,
      resetData,
      copyFixtures,
    }) => {
      await resetData();
      await page.goto("/");

      await page.getByRole("link", { name: "Create New Note" }).click();
      await page.getByLabel("Title *").fill("Existing Note");
      await page.getByLabel(/Slug/).fill("existing-note");
      await page
        .getByLabel("Content")
        .fill("This note already exists for testing updates and deletes.");
      await page.getByLabel(/Tags/).fill("test");
      await page.getByLabel(/Date/).fill("2023-11-14T00:00");
      await page.getByRole("button", { name: "Create Note" }).click();

      await expect(
        page.getByRole("heading", { name: "Existing Note" }),
      ).toBeVisible();

      await copyFixtures("one-note");
    });
  });

  test.describe("three-notes fixture", () => {
    test("generates three-notes fixture", async ({
      page,
      resetData,
      copyFixtures,
    }) => {
      await resetData();
      await page.goto("/");

      await page.getByRole("link", { name: "Create New Note" }).click();
      await page.getByLabel("Title *").fill("First Note");
      await page.getByLabel(/Slug/).fill("first-note");
      await page.getByLabel("Content").fill("This is the first note content.");
      await page.getByLabel(/Tags/).fill("important, work");
      await page.getByLabel(/Date/).fill("2023-10-01T00:00");
      await page.getByRole("button", { name: "Create Note" }).click();
      await expect(
        page.getByRole("heading", { name: "First Note" }),
      ).toBeVisible();

      await page.goto("/");
      await page.getByRole("link", { name: "Create New Note" }).click();
      await page.getByLabel("Title *").fill("Second Note");
      await page.getByLabel(/Slug/).fill("second-note");
      await page
        .getByLabel("Content")
        .fill(
          "This is the content of the second note.\n\nIt has multiple paragraphs.",
        );
      await page.getByLabel(/Date/).fill("2023-11-01T00:00");
      await page.getByRole("button", { name: "Create Note" }).click();
      await expect(
        page.getByRole("heading", { name: "Second Note" }),
      ).toBeVisible();

      await page.goto("/");
      await page.getByRole("link", { name: "Create New Note" }).click();
      await page.getByLabel("Title *").fill("Third Note");
      await page.getByLabel(/Slug/).fill("third-note");
      await page
        .getByLabel("Content")
        .fill("This is the newest note without tags.");
      await page.getByLabel(/Date/).fill("2023-11-15T00:00");
      await page.getByRole("button", { name: "Create Note" }).click();
      await expect(
        page.getByRole("heading", { name: "Third Note" }),
      ).toBeVisible();

      await page.goto("/");
      await checkNoteTitlesInOrder(page, [
        "Third Note",
        "Second Note",
        "First Note",
      ]);

      await copyFixtures("three-notes");
    });
  });

  test.describe("many-notes fixture", () => {
    /*
     * 14 notes at `perPage: 4` is the smallest corpus that exercises every
     * shape at once: `headPage` 3, numbered routes [0, 1] of four items each,
     * a six-item fold on the landing, and enough room above and below for a
     * delete to collapse the head.
     */
    test("generates many-notes fixture", async ({
      page,
      resetData,
      copyFixtures,
    }) => {
      test.setTimeout(120_000);
      await resetData();

      for (let index = 1; index <= 14; index++) {
        const number = String(index).padStart(2, "0");
        await page.goto("/notes/new");
        await page.getByLabel("Title *").fill(`Note ${number}`);
        await page.getByLabel(/Slug/).fill(`note-${number}`);
        await page.getByLabel("Content").fill(`Body of note ${number}.`);
        // Ascending dates, so note-14 is the newest and lands on the head.
        await page.getByLabel(/Date/).fill(`2024-01-${number}T00:00`);
        await page.getByRole("button", { name: "Create Note" }).click();
        await expect(
          page.getByRole("heading", { name: `Note ${number}` }),
        ).toBeVisible();
      }

      await page.goto("/notes/browse");
      await expect(page.getByText("Total notes: 14")).toBeVisible();
      await expect(
        page.getByTestId("browse-list").getByRole("listitem"),
      ).toHaveCount(6);

      await copyFixtures("many-notes");
    });
  });
});
