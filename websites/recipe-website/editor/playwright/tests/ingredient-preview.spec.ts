import { test, expect } from "../support/test";
import {
  fillSignInForm,
  fillMarkdownField,
  markdownEditorReady,
} from "../support/helpers";
import { snapshotLocator } from "../support/visual";

// Historically "Ingredient Auto-Preview" (plain input + live preview panel);
// the rows are Lexical rich editors now, so the WYSIWYG body *is* the preview.
// The filename is kept for history.
test.describe("Ingredient Lexical editing", () => {
  test.describe("with two-pages fixture", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("two-pages");
      await page.goto("/recipe/recipe-6/edit");
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page }) => {
        await fillSignInForm(page);
        // Gate on the recipe-form island hydrating so early field interactions
        // aren't dropped/reset mid-hydration (dev-mode flake).
        await markdownEditorReady(page, "description");
      });

      test("should show the rich editor with the fixture content", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();
        const editor = await markdownEditorReady(
          page,
          "ingredients[0].ingredient",
        );
        await expect(editor).toContainText("tsp salt");
      });

      test("should render a filled Multiplyable as a chip in the editor", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await fillMarkdownField(
          page,
          "ingredients[0].ingredient",
          '<Multiplyable baseNumber="2" /> cups sugar',
        );
        // Back to rich mode: the source edit re-imports into the editor.
        await page
          .getByLabel("Ingredient 1 Container")
          .getByRole("button", { name: "Editor", exact: true })
          .click();

        const editor = await markdownEditorReady(
          page,
          "ingredients[0].ingredient",
        );
        await expect(editor).toContainText("2 cups sugar");
        await expect(
          editor.locator('[data-lexical-multiplyable="2"]'),
        ).toBeVisible();
        await snapshotLocator(
          page.getByLabel("Ingredient 1 Container"),
          "ingredient-1-editor-2-cups-sugar.png",
        );
      });

      test("should render markdown in the editor", async ({ page }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await fillMarkdownField(
          page,
          "ingredients[0].ingredient",
          '<Multiplyable baseNumber="1" /> cup **strong** coffee',
        );
        await page
          .getByLabel("Ingredient 1 Container")
          .getByRole("button", { name: "Editor", exact: true })
          .click();

        const editor = await markdownEditorReady(
          page,
          "ingredients[0].ingredient",
        );
        await expect(editor.locator("strong")).toContainText("strong");
        await expect(editor).toContainText("1 cup strong coffee");
      });

      test("should edit newly added ingredients", async ({ page }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await page
          .getByRole("button", { name: "Add Ingredient", exact: true })
          .click();

        await markdownEditorReady(page, "ingredients[2].ingredient");
        await fillMarkdownField(
          page,
          "ingredients[2].ingredient",
          '<Multiplyable baseNumber="3" /> eggs',
        );

        await expect(
          page.locator('input[type=hidden][name="ingredients[2].ingredient"]'),
        ).toHaveValue('<Multiplyable baseNumber="3" /> eggs');
      });

      test("should keep the editor content when toggling between ingredient and heading", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        const editor = await markdownEditorReady(
          page,
          "ingredients[0].ingredient",
        );
        await expect(editor).toContainText("tsp salt");

        await page.getByLabel("Toggle Ingredient 1 Type").click();
        await expect(editor).toContainText("tsp salt");

        await page.getByLabel("Toggle Ingredient 1 Type").click();
        await expect(editor).toContainText("tsp salt");
      });

      test("should render the fixture Multiplyable at load", async ({
        page,
      }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        const editor = await markdownEditorReady(
          page,
          "ingredients[0].ingredient",
        );
        await expect(editor).toContainText("1 1/2 tsp salt");
        await expect(
          editor.locator('[data-lexical-multiplyable="1 1/2"]'),
        ).toBeVisible();
      });

      test("should persist an edit after form submission", async ({ page }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await fillMarkdownField(
          page,
          "ingredients[0].ingredient",
          '<Multiplyable baseNumber="2" /> tsp pepper',
        );

        await page.getByRole("button", { name: "Submit", exact: true }).click();

        await expect(
          page.getByRole("heading", { level: 1, name: "Recipe 6" }),
        ).toBeVisible();

        await expect(page.getByText("2 tsp pepper")).toBeVisible();

        await page.getByRole("link", { name: "Edit", exact: true }).click();

        const editor = await markdownEditorReady(
          page,
          "ingredients[0].ingredient",
        );
        await expect(editor).toContainText("2 tsp pepper");
        await expect(
          page.locator('input[type=hidden][name="ingredients[0].ingredient"]'),
        ).toHaveValue('<Multiplyable baseNumber="2" /> tsp pepper');
      });

      // Regression for the external-value sync: rows are keyed by index with
      // controlled values, so a reorder rewrites each mounted row's value from
      // outside — the editors must visibly follow, not just the hidden inputs.
      test("should visibly swap editors when reordering", async ({ page }) => {
        await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

        await markdownEditorReady(page, "ingredients[0].ingredient");
        await markdownEditorReady(page, "ingredients[1].ingredient");

        await page
          .getByLabel("Ingredient 1 Container")
          .getByRole("button", { name: "Move item down", exact: true })
          .click();

        await expect(
          page.locator('input[type=hidden][name="ingredients[0].ingredient"]'),
        ).toHaveValue('<Multiplyable baseNumber="1" /> cup water');
        await expect(
          page.locator('input[type=hidden][name="ingredients[1].ingredient"]'),
        ).toHaveValue('<Multiplyable baseNumber="1 1/2" /> tsp salt');

        await expect(
          await markdownEditorReady(page, "ingredients[0].ingredient"),
        ).toContainText("cup water");
        await expect(
          await markdownEditorReady(page, "ingredients[1].ingredient"),
        ).toContainText("tsp salt");
      });
    });
  });

  test.describe("ingredient import into mounted rows", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("two-pages");
      await page.goto("/recipe/recipe-6/edit");
      await fillSignInForm(page);
      await markdownEditorReady(page, "description");
    });

    // The edit page is the interesting surface for imports: rows 1 and 2 are
    // already mounted with fixture content, so the paste-import rewrites live
    // editors (the external-value sync), while row 3 mounts fresh.
    test("should show imported ingredients in the rich editors", async ({
      page,
    }) => {
      await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();

      await page.getByText("Paste Ingredients", { exact: true }).click();
      await page.getByTitle("Ingredients Paste Area").click();
      await page.getByTitle("Ingredients Paste Area").fill(
        `
* 1 cup water
* 2 tsp **sugar**
* 3 Tbsp oil
`,
      );

      await page.getByText("Import Ingredients", { exact: true }).click();

      await expect(
        page.locator('input[type=hidden][name="ingredients[0].ingredient"]'),
      ).toHaveValue('<Multiplyable baseNumber="1" /> cup water');
      await expect(
        await markdownEditorReady(page, "ingredients[0].ingredient"),
      ).toContainText("1 cup water");

      await expect(
        page.locator('input[type=hidden][name="ingredients[1].ingredient"]'),
      ).toHaveValue('<Multiplyable baseNumber="2" /> tsp **sugar**');
      const editor2 = await markdownEditorReady(
        page,
        "ingredients[1].ingredient",
      );
      await expect(editor2.locator("strong")).toContainText("sugar");
      await expect(editor2).toContainText("2 tsp sugar");

      await expect(
        page.locator('input[type=hidden][name="ingredients[2].ingredient"]'),
      ).toHaveValue('<Multiplyable baseNumber="3" /> Tbsp oil');
      await expect(
        await markdownEditorReady(page, "ingredients[2].ingredient"),
      ).toContainText("3 Tbsp oil");
    });
  });
});
