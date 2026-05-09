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
});
