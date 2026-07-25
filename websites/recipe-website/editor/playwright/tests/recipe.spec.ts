import { test, expect } from "../support/test";
import {
  checkNamesInOrder,
  fillSignInForm,
  markdownEditorReady,
} from "../support/helpers";
import { snapshotPage } from "../support/visual";

test.describe("Single Recipe View", () => {
  test.describe("with seven items", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("two-pages");
      await page.goto("/recipe/recipe-6");
    });

    test("should display a recipe", async ({ page }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Recipe 6" }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/Recipe 6/);
    });

    test("should not need authorization", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Sign In", exact: true }),
      ).toBeVisible();
    });

    test("should be able to multiply ingredient amounts", async ({ page }) => {
      await expect(page.getByText("1 1/2 tsp salt")).toBeVisible();
      await expect(
        page.getByText("Sprinkle 1/2 tsp salt in water"),
      ).toBeVisible();
      await page.getByLabel("Multiply").fill("2");
      await expect(page.getByText("3 tsp salt")).toBeVisible();
      await expect(
        page.getByText("Sprinkle 1 tsp salt in water"),
      ).toBeVisible();
      await snapshotPage(page, "recipe-6-multiplied.png");
    });

    test("keeps the scale control in view while scrolling", async ({
      page,
    }) => {
      const multiply = page.getByLabel("Multiply");
      await expect(multiply).toBeVisible();

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      const box = await multiply.boundingBox();
      const viewport = page.viewportSize();
      expect(box).not.toBeNull();
      expect(viewport).not.toBeNull();
      // The sticky bar holds the control at the top of the viewport rather than
      // letting it scroll off with the hero.
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeLessThan(viewport!.height);
    });

    test("prints a clean recipe: ingredients shown, screen controls hidden", async ({
      page,
    }) => {
      await page.emulateMedia({ media: "print" });

      // The ingredient list is part of the printout.
      await expect(page.getByText("1 1/2 tsp salt")).toBeVisible();

      // The sticky scale bar and the checklist Reset buttons are screen-only.
      await expect(page.getByLabel("Multiply")).toBeHidden();
      await expect(page.getByRole("button", { name: "Reset" })).toHaveCount(0);

      await page.emulateMedia({ media: "screen" });
    });

    test("should be able to edit a recipe", async ({ page }) => {
      await page.getByRole("link", { name: "Edit", exact: true }).click();
      await fillSignInForm(page);

      await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible({
        timeout: 10_000,
      });
      await markdownEditorReady(page, "description");

      const editedRecipe = "Edited Recipe";

      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(editedRecipe);

      const recipeDate = "2023-12-08T01:16:12.622";
      await expect(page.getByLabel("Date (UTC)")).toHaveValue(recipeDate);

      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("heading", { level: 1, name: editedRecipe }),
      ).toBeVisible();

      await page.goto("/");
      await expect(page.getByText(editedRecipe)).toBeVisible();
      await checkNamesInOrder(page, [
        "Recipe 7",
        editedRecipe,
        "Recipe 5",
        "Recipe 4",
        "Recipe 3",
        "Recipe 2",
      ]);

      const dateText = new Date(recipeDate + "Z").toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      await expect(
        page
          .getByText(editedRecipe)
          .locator("xpath=ancestor::*[1]")
          .getByText(dateText),
      ).toBeVisible();
    });

    test("should be able to delete the recipe", async ({ page, request }) => {
      await page.getByRole("button", { name: "Sign In", exact: true }).click();
      await fillSignInForm(page);

      await page.getByRole("button", { name: "Delete", exact: true }).click();

      await expect(page.getByText("Recipe 4")).toBeVisible();
      await checkNamesInOrder(page, [
        "Recipe 7",
        "Recipe 5",
        "Recipe 4",
        "Recipe 3",
        "Recipe 2",
        "Recipe 1",
      ]);
      const response = await request.get("/recipe/recipe-6");
      expect(response.status()).toBe(404);
    });
  });

  test("should have status 404 when recipe doesn't exist", async ({
    request,
  }) => {
    const response = await request.get("/recipe/non-existent-recipe");
    expect(response.status()).toBe(404);
  });
});
