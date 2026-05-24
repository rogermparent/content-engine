import { test, expect } from "../support/test";
import { fillSignInForm, signIn } from "../support/helpers";
import { snapshotPage } from "../support/visual";

test.describe("Featured Recipes", () => {
  test.describe("homepage display", () => {
    test("should not show featured recipes section when there are none", async ({
      page,
      resetData,
    }) => {
      await resetData();
      await page.goto("/");
      await expect(page.getByText("Latest Recipes")).toBeVisible();
      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toHaveCount(0);
    });

    test("should show featured recipes on homepage", async ({
      page,
      resetData,
    }) => {
      await resetData("one-featured-recipe");
      await page.goto("/");

      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();
      await expect(
        page
          .locator("h2", { hasText: "Featured Recipes" })
          .locator("xpath=ancestor::*[1]")
          .getByText("Featured Recipe", { exact: true }),
      ).toBeVisible();
    });

    test("should show first 6 featured recipes on homepage", async ({
      page,
      resetData,
    }) => {
      await resetData("many-featured-recipes");
      await page.goto("/");

      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();
      const featuredSection = page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
      for (let i = 15; i >= 10; i--) {
        await expect(
          featuredSection.getByText(`Recipe ${i}`, { exact: true }),
        ).toBeVisible();
      }
      await expect(
        featuredSection.getByText("Recipe 9", { exact: true }),
      ).toHaveCount(0);
    });

    test("should not show View Feature link on homepage", async ({
      page,
      resetData,
    }) => {
      await resetData("one-featured-recipe");
      await page.goto("/");

      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();
      const featuredSection = page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
      await expect(
        featuredSection.getByText("Featured Recipe", { exact: true }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "View Feature", exact: true }),
      ).toHaveCount(0);
    });

    test("should not show note on homepage", async ({ page, resetData }) => {
      await resetData("one-featured-recipe");
      await page.goto("/");

      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();
      const featuredSection = page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
      await expect(
        featuredSection.getByText("Featured Recipe", { exact: true }),
      ).toBeVisible();
      await expect(
        featuredSection.getByText("This recipe is featured for testing."),
      ).toHaveCount(0);
    });
  });

  test.describe("index page", () => {
    test("should show all featured recipes on index page", async ({
      page,
      resetData,
    }) => {
      await resetData("many-featured-recipes");
      await page.goto("/featured-recipes");

      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Recipe 15", { exact: true })).toBeVisible();
      await expect(page.getByText("Recipe 4", { exact: true })).toBeVisible();
    });

    test("should show note on index page", async ({ page, resetData }) => {
      await resetData("one-featured-recipe");
      await page.goto("/featured-recipes");

      await expect(
        page.getByText("This recipe is featured for testing."),
      ).toBeVisible();
    });

    test("should show View Feature link on featured recipes index page", async ({
      page,
      resetData,
    }) => {
      await resetData("one-featured-recipe");
      await page.goto("/featured-recipes");

      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "View Feature", exact: true }),
      ).toBeVisible();

      await page
        .getByRole("link", { name: "View Feature", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Featured Recipe" }),
      ).toBeVisible();
    });
  });

  test.describe("creation", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("one-recipe");
      await page.goto("/recipe/existing-recipe");
      await signIn(page);
    });

    test("should allow recipes to be featured multiple times", async ({
      page,
    }) => {
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await page.getByLabel("Note").fill("First feature");
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page.getByRole("listitem")).toHaveCount(2);

      await page.goto("/recipe/existing-recipe");
      await expect(
        page.getByRole("heading", { name: "Existing Recipe" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await page.getByLabel("Note").fill("Second feature");
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page.getByRole("listitem")).toHaveCount(3);

      await page.goto("/featured-recipes");
      await expect(
        page.getByText("Existing Recipe", { exact: true }),
      ).toHaveCount(2);
      await expect(page.getByText("First feature")).toBeVisible();
      await expect(page.getByText("Second feature")).toBeVisible();
    });

    test("should sort featured recipes by feature date", async ({
      page,
      resetData,
    }) => {
      await resetData("three-recipes");

      await page.goto("/recipe/third-recipe");
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.waitForTimeout(1100);

      await page.goto("/recipe/first-recipe");
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.waitForTimeout(1100);

      await page.goto("/recipe/second-recipe");
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);

      await page.goto("/featured-recipes");
      const featuredItems = page.getByRole("listitem");
      await expect(
        featuredItems.nth(0).getByText(/Second Recipe/),
      ).toBeVisible();
      await expect(
        featuredItems.nth(1).getByText(/First Recipe/),
      ).toBeVisible();
      await expect(
        featuredItems.nth(2).getByText(/Third Recipe/),
      ).toBeVisible();
    });
  });

  test.describe("deletion", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("one-featured-recipe");
      await page.goto("/featured-recipes");
      await page
        .getByRole("link", { name: "View Feature", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Featured Recipe" }),
      ).toBeVisible();
      await signIn(page);
    });

    test("should be able to delete a featured recipe", async ({
      page,
      baseURL,
      request,
    }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Featured Recipe" }),
      ).toBeVisible();

      const featuredRecipeUrl = new URL(page.url()).pathname;

      await page.getByRole("button", { name: "Delete", exact: true }).click();

      await expect(page).toHaveURL(baseURL + "/");
      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toHaveCount(0);

      const response = await request.get(featuredRecipeUrl);
      expect(response.status()).toBe(404);
    });
  });

  test.describe("Feature button", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("one-recipe");
      await page.goto("/recipe/existing-recipe");
      await signIn(page);
    });

    test("should have a Feature button on recipe pages", async ({ page }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Existing Recipe" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Feature", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Edit", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Copy", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Delete", exact: true }),
      ).toBeVisible();
    });

    test("should navigate to featured recipe form with recipe pre-selected when clicking Feature button", async ({
      page,
      baseURL,
    }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Existing Recipe" }),
      ).toBeVisible();

      await page.getByRole("link", { name: "Feature", exact: true }).click();

      await expect(page).toHaveURL(
        /\/featured-recipe\/new\?.*recipe=existing-recipe/,
      );

      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(page).toHaveURL(baseURL + "/");
      await expect(
        page
          .locator("h2", { hasText: "Featured Recipes" })
          .locator("xpath=ancestor::*[1]")
          .getByText("Existing Recipe", { exact: true }),
      ).toBeVisible();
    });

    test("should allow adding a note when featuring from Feature button", async ({
      page,
      baseURL,
    }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Existing Recipe" }),
      ).toBeVisible();

      await page.getByRole("link", { name: "Feature", exact: true }).click();

      await page
        .getByLabel("Note")
        .fill("This recipe was featured from the Feature button");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(page).toHaveURL(baseURL + "/");
      await page.goto("/featured-recipes");
      await expect(
        page.getByText("This recipe was featured from the Feature button"),
      ).toBeVisible();
    });
  });

  test.describe("new page", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("one-recipe");
      await page.goto("/featured-recipe/new?recipe=existing-recipe");
    });

    test("should require authentication", async ({ page }) => {
      await expect(
        page.getByRole("button", {
          name: "Sign in with Credentials",
          exact: true,
        }),
      ).toBeVisible();
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page }) => {
        await fillSignInForm(page);
      });

      test("should be able to create a featured recipe", async ({
        page,
        baseURL,
      }) => {
        await page.getByRole("button", { name: "Submit", exact: true }).click();

        await expect(page).toHaveURL(baseURL + "/");
        await expect(
          page
            .locator("h2", { hasText: "Featured Recipes" })
            .locator("xpath=ancestor::*[1]")
            .getByText("Existing Recipe", { exact: true }),
        ).toBeVisible();
      });

      test("should allow adding a note when creating a featured recipe", async ({
        page,
        baseURL,
      }) => {
        await page
          .getByLabel("Note")
          .fill("This is a test note for the feature");
        await page.getByRole("button", { name: "Submit", exact: true }).click();

        await expect(page).toHaveURL(baseURL + "/");
        await page.goto("/featured-recipes");
        await expect(
          page.getByText("This is a test note for the feature"),
        ).toBeVisible();
      });
    });
  });

  test.describe("edit page", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("one-featured-recipe");
      await page.goto("/featured-recipes");
      await page
        .getByRole("link", { name: "View Feature", exact: true })
        .click();
      await page.getByRole("link", { name: "Edit", exact: true }).click();
    });

    test("should require authentication", async ({ page }) => {
      await expect(
        page.getByRole("button", {
          name: "Sign in with Credentials",
          exact: true,
        }),
      ).toBeVisible();
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page }) => {
        await fillSignInForm(page);
      });

      test("should be able to edit a featured recipe note", async ({
        page,
        baseURL,
      }) => {
        await page.getByLabel("Note").clear();
        await page.getByLabel("Note").fill("This message is edited!");
        await page.getByRole("button", { name: "Submit", exact: true }).click();

        await expect(page).toHaveURL(baseURL + "/");

        await page.goto("/featured-recipes");
        await expect(page.getByText("This message is edited!")).toBeVisible();
      });

      test("should be able to change a featured recipe slug", async ({
        page,
        baseURL,
        request,
      }) => {
        const featuredRecipeUrl = new URL(page.url()).pathname.replace(
          /\/edit$/,
          "",
        );

        await expect(page.getByLabel("Slug")).toBeVisible();
        await page.getByLabel("Slug").clear();
        const newSlug = "custom-featured-slug";
        await page.getByLabel("Slug").fill(newSlug);
        await page.getByRole("button", { name: "Submit", exact: true }).click();

        await expect(page).toHaveURL(baseURL + "/");

        await page.goto("/featured-recipes");
        await page
          .getByRole("link", { name: "View Feature", exact: true })
          .click();
        await expect(page).toHaveURL(baseURL + `/featured-recipe/${newSlug}`);

        const response = await request.get(featuredRecipeUrl);
        expect(response.status()).toBe(404);
      });
    });
  });

  test.describe("recipe selection modal", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData("three-recipes");
      await page.goto("/featured-recipe/new");
      await fillSignInForm(page);
    });

    test("should open recipe selection modal when clicking select button", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByLabel("Query")).toBeVisible();
    });

    test("should search for recipes in modal", async ({ page }) => {
      await expect(page.getByText("New Featured Recipe")).toBeVisible();
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await page.getByLabel("Query").fill("First Recipe");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Submit", exact: true })
        .click();

      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("button", { name: /First Recipe/ }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /Second Recipe/ }),
      ).toHaveCount(0);
    });

    test("should select recipe from modal and close", async ({ page }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await expect(page.getByRole("dialog")).toBeAttached();
      await page.getByRole("dialog").getByLabel("Query").fill("Second Recipe");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Submit", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("listitem")
        .getByRole("button")
        .click();

      await expect(page.getByRole("dialog")).toHaveCount(0);

      await expect(page.getByText("Selected: Second Recipe")).toBeVisible();
    });

    test("should create featured recipe with modal-selected recipe", async ({
      page,
      baseURL,
    }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Query").fill("First Recipe");
      await dialog.getByRole("button", { name: "Submit", exact: true }).click();
      await dialog.getByRole("listitem").getByRole("button").click();
      await expect(page.getByRole("dialog")).toHaveCount(0);

      await page.getByLabel("Note").fill("Featured via modal selection");
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(page).toHaveURL(baseURL + "/");
      await expect(
        page
          .locator("h2", { hasText: "Featured Recipes" })
          .locator("xpath=ancestor::*[1]")
          .getByText(/First Recipe/),
      ).toBeVisible();
    });

    test("should close modal on overlay click", async ({ page }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("should clear selected recipe", async ({ page }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Query").fill("Third Recipe");
      await dialog.getByRole("button", { name: "Submit", exact: true }).click();
      await dialog.getByRole("listitem").getByRole("button").click();
      await expect(page.getByText("Selected: Third Recipe")).toBeVisible();

      await page.getByRole("button", { name: "Clear", exact: true }).click();
      await expect(page.getByText("Selected: Third Recipe")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Select Recipe", exact: true }),
      ).toBeVisible();
    });

    test("should show no recipes in modal initially", async ({ page }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await expect(page.getByRole("dialog").getByRole("listitem")).toHaveCount(
        0,
      );
    });
  });

  test.describe("pagination", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData();
      await page.goto("/");
    });

    test("should show pagination on index page when more than 12 featured recipes", async ({
      page,
      resetData,
    }) => {
      await resetData("many-featured-recipes");

      await page.goto("/featured-recipes");
      await expect(
        page.getByText("Featured Recipes", { exact: true }),
      ).toBeVisible();

      await expect(page.getByText("Recipe 15", { exact: true })).toBeVisible();
      await expect(page.getByText("Recipe 4", { exact: true })).toBeVisible();
      await expect(page.getByText("Recipe 3", { exact: true })).toHaveCount(0);

      await expect(page.locator('[aria-current="page"]')).toHaveText("1");

      await expect(
        page.getByRole("link", { name: "Go to next page" }),
      ).toBeVisible();
    });

    test("should navigate to page 2", async ({ page, baseURL, resetData }) => {
      await resetData("many-featured-recipes");

      await page.goto("/featured-recipes");
      await page.getByRole("link", { name: "Go to next page" }).click();

      await expect(page).toHaveURL(baseURL + "/featured-recipes/2");

      await expect(page.getByText("Recipe 3", { exact: true })).toBeVisible();
      await expect(page.getByText("Recipe 2", { exact: true })).toBeVisible();
      await expect(page.getByText("Recipe 1", { exact: true })).toBeVisible();

      await expect(page.locator('[aria-current="page"]')).toHaveText("2");

      await expect(
        page.getByRole("link", { name: "Go to next page" }),
      ).toHaveCount(0);

      await snapshotPage(page, "featured-recipes-page-2.png");
    });

    test("should navigate back from page 2 to unnumbered first page", async ({
      page,
      baseURL,
      resetData,
    }) => {
      await resetData("many-featured-recipes");

      await page.goto("/featured-recipes/2");
      await expect(page.locator('[aria-current="page"]')).toHaveText("2");

      await page.getByRole("link", { name: "Go to previous page" }).click();

      await expect(page).toHaveURL(baseURL + "/featured-recipes");
      await expect(page.locator('[aria-current="page"]')).toHaveText("1");
    });

    test("should redirect /featured-recipes/1 to /featured-recipes", async ({
      page,
      baseURL,
      resetData,
    }) => {
      await resetData("one-featured-recipe");

      await page.goto("/featured-recipes/1");

      await expect(page).toHaveURL(baseURL + "/featured-recipes");
    });

    test("should show Home link on first page instead of back arrow", async ({
      page,
      resetData,
    }) => {
      await resetData("one-featured-recipe");

      await page.goto("/featured-recipes");

      await expect(
        page.getByRole("link", { name: "Go to home" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Go to previous page" }),
      ).toHaveCount(0);
    });
  });
});
