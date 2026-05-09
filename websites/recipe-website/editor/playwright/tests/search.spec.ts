import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";

test.describe("Search Page", () => {
  test.describe("with many featured recipes", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("many-featured-recipes");
      await page.goto("/search");
    });

    test("should preserve search state between search page and featured recipe selector", async ({
      page,
    }) => {
      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("Recipe 5");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 5");

      await page.goto("/featured-recipe/new");
      await fillSignInForm(page);

      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByLabel("Query")).toHaveValue("Recipe 5");
    });
  });

  test.describe("with seven items", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("two-pages");
      await page.goto("/search");
    });

    test("should not need authorization", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Sign In", exact: true }),
      ).toBeVisible();
    });

    test("should preserve search state when navigating history between searches", async ({
      page,
    }) => {
      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("Recipe 5");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 5");

      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("Recipe 6");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6");

      await page.goBack();

      await expect(page.getByLabel("Query")).toHaveValue("Recipe 5");
      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 5");
    });

    test("should preserve search state when navigating history between searches and result pages", async ({
      page,
    }) => {
      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("Recipe 5");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 5");

      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("Recipe 6");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6");

      await page.getByRole("listitem").first().getByRole("heading").click();

      await expect(
        page.getByRole("heading", { name: /Ingredients/ }),
      ).toBeVisible();

      await page.goBack();

      await expect(page.getByLabel("Query")).toHaveValue("Recipe 6");
      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6");

      await page.goBack();

      await expect(page.getByLabel("Query")).toHaveValue("Recipe 5");
      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 5");
    });

    test("should be able to find a single recipe by name", async ({ page }) => {
      await page.getByLabel("Query").fill("Recipe 6");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6", { timeout: 15_000 });

      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("6 Recipe");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6");

      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("recipe 6");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6");

      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("6");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 6");

      await page.getByLabel("Query").clear();
      await page.getByLabel("Query").fill("5");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Recipe 5");
    });

    test("should be able to find a recipe by ingredient", async ({ page }) => {
      await page.getByLabel("Query").fill("sal");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(page.getByRole("heading", { name: "Recipe 6" })).toBeVisible(
        { timeout: 15_000 },
      );

      await expect(
        page.getByText(/^1 1\/2 tsp.*t$/).getByText("sal"),
      ).toBeVisible();
    });
  });
});
