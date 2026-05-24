import { test, expect } from "../support/test";
import { fillSignInForm, signIn } from "../support/helpers";
import { snapshotPage } from "../support/visual";

test.describe("Visual baselines @visual", () => {
  test("homepage with three recipes", async ({ page, resetData }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await snapshotPage(page, "homepage-three-recipes.png");
  });

  test("homepage with two-page recipe set shows 'More Latest Recipes'", async ({
    page,
    resetData,
  }) => {
    await resetData("two-pages");
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "More Latest Recipes", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "homepage-two-pages.png");
  });

  test("recipe detail page (signed-out)", async ({ page, resetData }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6");
    await expect(
      page.getByRole("heading", { level: 1, name: "Recipe 6" }),
    ).toBeVisible();
    await snapshotPage(page, "recipe-detail-signed-out.png");
  });

  test("recipe detail page (signed-in)", async ({ page, resetData }) => {
    await resetData("two-pages");
    await page.goto("/");
    await signIn(page);
    await page.goto("/recipe/recipe-6");
    await expect(
      page.getByRole("link", { name: "Edit", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "recipe-detail-signed-in.png");
  });

  test("featured recipe detail page (signed-in)", async ({
    page,
    resetData,
  }) => {
    await resetData("one-featured-recipe");
    await page.goto("/");
    await signIn(page);
    await page.goto("/featured-recipes");
    await page
      .getByRole("link", { name: /Featured Recipe/i })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "featured-recipe-detail-signed-in.png");
  });

  test("new-recipe form", async ({ page, resetData }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/new-recipe");
    await expect(page.getByLabel("Name").first()).toBeVisible();
    await snapshotPage(page, "new-recipe-form.png");
  });

  test("new-recipe form with slug conflict shows Overwrite", async ({
    page,
    resetData,
  }) => {
    await resetData("one-recipe");
    await page.goto("/new-recipe");
    await fillSignInForm(page);
    await page.locator('[name="name"]').fill("Existing Recipe");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Overwrite", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "new-recipe-form-overwrite.png");
  });

  test("edit form populated", async ({ page, resetData }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6/edit");
    await fillSignInForm(page);
    await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible({
      timeout: 10_000,
    });
    await snapshotPage(page, "edit-form-populated.png");
  });

  test("edit form with slug conflict shows Overwrite", async ({
    page,
    resetData,
  }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6/edit");
    await fillSignInForm(page);
    await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByLabel("Slug").clear();
    await page.getByLabel("Slug").fill("recipe-5");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Overwrite", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "edit-form-overwrite.png");
  });

  test("markdown editor preview tab active", async ({ page, resetData }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6/edit");
    await fillSignInForm(page);
    await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible({
      timeout: 10_000,
    });
    const descriptionField = page
      .getByLabel("Description")
      .locator("xpath=ancestor::*[contains(@class,'border')][1]");
    await descriptionField
      .getByRole("button", { name: "Preview", exact: true })
      .click();
    await expect(
      descriptionField.getByRole("button", {
        name: "Preview",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await snapshotPage(page, "markdown-preview-tab.png");
  });

  test("git page with branches and remotes", async ({
    page,
    resetData,
    initializeContentGit,
  }) => {
    await resetData();
    await initializeContentGit();
    await page.goto("/git");
    await fillSignInForm(page);
    await expect(
      page.getByRole("button", { name: "Checkout", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "git-page.png");
  });

  test("page view with edit/delete actions (signed-in)", async ({
    page,
    resetData,
  }) => {
    await resetData("about-page");
    await page.goto("/");
    await signIn(page);
    await page.goto("/about");
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "page-view-signed-in.png");
  });

  test("layout footer signed out", async ({ page, resetData }) => {
    await resetData();
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeVisible();
    await snapshotPage(page, "layout-footer-signed-out.png");
  });

  test("layout footer signed in", async ({ page, resetData }) => {
    await resetData();
    await page.goto("/");
    await signIn(page);
    await expect(
      page.getByRole("button", { name: "Sign Out", exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    await snapshotPage(page, "layout-footer-signed-in.png");
  });

  test("featured-recipes page with many items", async ({ page, resetData }) => {
    await resetData("many-featured-recipes");
    await page.goto("/featured-recipes");
    await expect(page.getByRole("listitem").first()).toBeVisible();
    await snapshotPage(page, "featured-recipes-page1.png");
  });

  test("search page with no query", async ({ page, resetData }) => {
    await resetData("three-recipes");
    await page.goto("/search");
    await expect(page.getByLabel("Query")).toBeVisible();
    await snapshotPage(page, "search-page-empty.png");
  });

  test("search page with hits", async ({ page, resetData }) => {
    await resetData("three-recipes");
    await page.goto("/search");
    await page.getByLabel("Query").fill("Recipe");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByRole("listitem").first()).toBeVisible();
    await snapshotPage(page, "search-page-with-hits.png");
  });
});
