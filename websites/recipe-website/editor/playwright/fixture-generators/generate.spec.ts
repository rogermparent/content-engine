/**
 * Fixture Generation Spec
 *
 * Generates the test fixtures used by other tests.
 * Run explicitly with `pnpm generate-fixtures`; not part of the normal suite.
 */

import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";

test.describe("Fixture Generation", () => {
  test("generates one-recipe fixture", async ({
    page,
    resetData,
    copyFixtures,
  }) => {
    await resetData();
    await page.goto("/new-recipe");
    await fillSignInForm(page);

    await page.getByLabel("Name").fill("Existing Recipe");
    await page.getByLabel("Slug").fill("existing-recipe");
    await page.getByText("Submit").click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Existing Recipe" }),
    ).toBeVisible();

    await copyFixtures("one-recipe");
  });

  test("generates three-recipes fixture", async ({
    page,
    resetData,
    copyFixtures,
  }) => {
    await resetData();
    await page.goto("/new-recipe");
    await fillSignInForm(page);

    await page.getByLabel("Name").fill("First Recipe");
    await page.getByLabel("Description").fill("This is the first recipe.");
    await page.getByLabel("Slug").fill("first-recipe");
    await page.getByText("Submit").click();
    await expect(
      page.getByRole("heading", { level: 1, name: "First Recipe" }),
    ).toBeVisible();

    await page.goto("/new-recipe");
    await page.getByLabel("Name").fill("Second Recipe");
    await page.getByLabel("Description").fill("This is the second recipe.");
    await page.getByLabel("Slug").fill("second-recipe");
    await page.getByText("Submit").click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Second Recipe" }),
    ).toBeVisible();

    await page.goto("/new-recipe");
    await page.getByLabel("Name").fill("Third Recipe");
    await page.getByLabel("Description").fill("This is the third recipe.");
    await page.getByLabel("Slug").fill("third-recipe");
    await page.getByText("Submit").click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Third Recipe" }),
    ).toBeVisible();

    await page.goto("/recipes");
    await expect(page.getByText("First Recipe")).toBeVisible();
    await expect(page.getByText("Second Recipe")).toBeVisible();
    await expect(page.getByText("Third Recipe")).toBeVisible();

    await copyFixtures("three-recipes");
  });

  test("generates one-featured-recipe fixture", async ({
    page,
    resetData,
    copyFixtures,
  }) => {
    await resetData();
    await page.goto("/new-recipe");
    await fillSignInForm(page);

    await page.getByLabel("Name").fill("Featured Recipe");
    await page.getByLabel("Slug").fill("featured-recipe");
    await page.getByText("Submit").click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Featured Recipe" }),
    ).toBeVisible();

    await page.getByText("Feature").click();
    await page.getByLabel("Note").fill("This recipe is featured for testing.");
    await page.getByText("Submit").click();

    await expect(page).toHaveURL(/\/$/);

    await expect(page.getByText("Featured Recipes")).toBeVisible();
    await expect(
      page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]")
        .getByText("Featured Recipe"),
    ).toBeVisible();

    await copyFixtures("one-featured-recipe");
  });

  test("generates many-featured-recipes fixture", async ({
    page,
    resetData,
    copyFixtures,
  }) => {
    await resetData();
    await page.goto("/new-recipe");
    await fillSignInForm(page);

    for (let i = 1; i <= 15; i++) {
      await page.goto("/new-recipe");
      await page.getByLabel("Name").fill(`Recipe ${i}`);
      await page.getByLabel("Slug").clear();
      await page.getByLabel("Slug").fill(`recipe-${i}`);
      await page.getByText("Submit").click();
      await expect(
        page.getByRole("heading", { level: 1, name: `Recipe ${i}` }),
      ).toBeVisible();
    }

    for (let i = 1; i <= 15; i++) {
      await page.goto(`/recipe/recipe-${i}`);
      await page.getByText("Feature").click();
      await page.getByText("Submit").click();
      await expect(page).toHaveURL(/\/$/);
    }

    await page.goto("/featured-recipes");
    await expect(page.getByText("Featured Recipes")).toBeVisible();
    await expect(page.getByText("→")).toBeVisible();

    await copyFixtures("many-featured-recipes");
  });
});
