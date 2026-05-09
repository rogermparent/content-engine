import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";

test.describe("Ingredient Auto-Preview", () => {
  test.describe("with two-pages fixture", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("two-pages");
      await page.goto("/recipe/recipe-6/edit");
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page }) => {
        await fillSignInForm(page);
      });

      test("should show ingredient input and preview side-by-side", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();
        await expect(page.getByLabel("Ingredient 1")).toBeVisible();
        await expect(page.getByLabel("Ingredient 1 Preview")).toBeAttached();
      });

      test("should auto-update preview when typing in ingredient field", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await page.getByLabel("Ingredient 1").click();
        await page.getByLabel("Ingredient 1").clear();
        await page
          .getByLabel("Ingredient 1")
          .fill('<Multiplyable baseNumber="2" /> cups sugar');

        await expect(page.getByLabel("Ingredient 1 Preview")).toHaveText(
          "2 cups sugar",
        );
      });

      test("should render markdown in the preview", async ({ page }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await page.getByLabel("Ingredient 1").click();
        await page.getByLabel("Ingredient 1").clear();
        await page
          .getByLabel("Ingredient 1")
          .fill('<Multiplyable baseNumber="1" /> cup **strong** coffee');

        await expect(
          page.getByLabel("Ingredient 1 Preview").locator("strong"),
        ).toContainText("strong");
        await expect(page.getByLabel("Ingredient 1 Preview")).toHaveText(
          "1 cup strong coffee",
        );
      });

      test("should handle empty ingredient input gracefully", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await page.getByLabel("Ingredient 1").click();
        await page.getByLabel("Ingredient 1").clear();

        await expect(page.getByLabel("Ingredient 1 Preview")).toBeAttached();
        await expect(page.getByLabel("Ingredient 1 Preview")).toHaveText("");
      });

      test("should show preview for newly added ingredients", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await page.getByText("Add Ingredient").click();

        await expect(page.getByLabel("Ingredient 3")).toBeAttached();
        await page.getByLabel("Ingredient 3").click();

        await page
          .getByLabel("Ingredient 3")
          .fill('<Multiplyable baseNumber="3" /> eggs');

        await expect(page.getByLabel("Ingredient 3 Preview")).toHaveText(
          "3 eggs",
        );
      });

      test("should maintain preview when toggling between ingredient and heading", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await expect(page.getByLabel("Ingredient 1 Preview")).toBeAttached();

        await page.getByLabel("Toggle Ingredient 1 Type").click();

        await expect(page.getByLabel("Ingredient 1 Preview")).toBeAttached();

        await page.getByLabel("Toggle Ingredient 1 Type").click();

        await expect(page.getByLabel("Ingredient 1 Preview")).toBeAttached();
      });

      test("should render Multiplyable component in preview", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await expect(page.getByLabel("Ingredient 1 Preview")).toHaveText(
          "1 1/2 tsp salt",
        );
      });

      test("should persist preview state after form submission", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await page.getByLabel("Ingredient 1").click();
        await page.getByLabel("Ingredient 1").clear();
        await page
          .getByLabel("Ingredient 1")
          .fill('<Multiplyable baseNumber="2" /> tsp pepper');

        await page.getByText("Submit").click();

        await expect(
          page.getByRole("heading", { level: 1, name: "Recipe 6" }),
        ).toBeVisible();

        await expect(page.getByText("2 tsp pepper")).toBeVisible();

        await page.getByRole("link", { name: "Edit", exact: true }).click();

        await expect(page.getByLabel("Ingredient 1 Preview")).toHaveText(
          "2 tsp pepper",
        );
      });
    });
  });

  test.describe("ingredient import with preview", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("two-pages");
      await page.goto("/recipe/recipe-6/edit");
      await fillSignInForm(page);
    });

    test("should show preview for imported ingredients", async ({ page }) => {
      await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

      await page.getByText("Paste Ingredients").click();
      await page.getByTitle("Ingredients Paste Area").click();
      await page.getByTitle("Ingredients Paste Area").fill(
        `
* 1 cup water
* 2 tsp **sugar**
* 3 Tbsp oil
`,
      );

      await page.getByText("Import Ingredients").click();

      await expect(page.getByLabel("Ingredient 1")).toHaveValue(
        '<Multiplyable baseNumber="1" /> cup water',
      );
      await expect(page.getByLabel("Ingredient 1 Preview")).toHaveText(
        "1 cup water",
      );

      await expect(page.getByLabel("Ingredient 2")).toHaveValue(
        '<Multiplyable baseNumber="2" /> tsp **sugar**',
      );
      await expect(
        page.getByLabel("Ingredient 2 Preview").locator("strong"),
      ).toContainText("sugar");
      await expect(page.getByLabel("Ingredient 2 Preview")).toHaveText(
        "2 tsp sugar",
      );

      await expect(page.getByLabel("Ingredient 3")).toHaveValue(
        '<Multiplyable baseNumber="3" /> Tbsp oil',
      );
      await expect(page.getByLabel("Ingredient 3 Preview")).toHaveText(
        "3 Tbsp oil",
      );
    });
  });
});
