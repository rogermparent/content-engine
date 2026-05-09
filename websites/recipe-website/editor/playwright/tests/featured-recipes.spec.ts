import { test, expect } from "../support/test";
import { fillSignInForm, signIn } from "../support/helpers";

test.describe("Featured Recipes", () => {
  test.describe("homepage display", () => {
    test("should not show featured recipes section when there are none", async ({
      page,
      resetData,
    }) => {
      await resetData();
      await page.goto("/");
      await expect(page.getByText("Latest Recipes")).toBeVisible();
      await expect(page.getByText("Featured Recipes")).toHaveCount(0);
    });

    test("should show featured recipes on homepage", async ({
      page,
      resetData,
    }) => {
      await resetData("one-featured-recipe");
      await page.goto("/");

      await expect(page.getByText("Featured Recipes")).toBeVisible();
      await expect(
        page
          .locator("h2", { hasText: "Featured Recipes" })
          .locator("xpath=ancestor::*[1]")
          .getByText("Featured Recipe"),
      ).toBeVisible();
    });

    test("should show first 6 featured recipes on homepage", async ({
      page,
      resetData,
    }) => {
      await resetData("many-featured-recipes");
      await page.goto("/");

      await expect(page.getByText("Featured Recipes")).toBeVisible();
      const featuredSection = page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
      for (let i = 15; i >= 10; i--) {
        await expect(featuredSection.getByText(`Recipe ${i}`)).toBeVisible();
      }
      await expect(featuredSection.getByText("Recipe 9")).toHaveCount(0);
    });

    test("should not show View Feature link on homepage", async ({
      page,
      resetData,
    }) => {
      await resetData("one-featured-recipe");
      await page.goto("/");

      await expect(page.getByText("Featured Recipes")).toBeVisible();
      const featuredSection = page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
      await expect(featuredSection.getByText("Featured Recipe")).toBeVisible();

      await expect(page.getByText("View Feature")).toHaveCount(0);
    });

    test("should not show note on homepage", async ({ page, resetData }) => {
      await resetData("one-featured-recipe");
      await page.goto("/");

      await expect(page.getByText("Featured Recipes")).toBeVisible();
      const featuredSection = page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
      await expect(featuredSection.getByText("Featured Recipe")).toBeVisible();
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

      await expect(page.getByText("Featured Recipes")).toBeVisible();
      await expect(page.getByText("Recipe 15")).toBeVisible();
      await expect(page.getByText("Recipe 4")).toBeVisible();
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

      await expect(page.getByText("Featured Recipes")).toBeVisible();

      await expect(page.getByText("View Feature")).toBeVisible();

      await page.getByText("View Feature").click();
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
      await page.getByText("Feature").click();
      await page.getByLabel("Note").fill("First feature");
      await page.getByText("Submit").click();
      await expect(page.getByRole("listitem")).toHaveCount(2);

      await page.goto("/recipe/existing-recipe");
      await expect(
        page.getByRole("heading", { name: "Existing Recipe" }),
      ).toBeVisible();
      await page.getByText("Feature").click();
      await page.getByLabel("Note").fill("Second feature");
      await page.getByText("Submit").click();
      await expect(page.getByRole("listitem")).toHaveCount(3);

      await page.goto("/featured-recipes");
      await expect(page.getByText("Existing Recipe")).toHaveCount(2);
      await expect(page.getByText("First feature")).toBeVisible();
      await expect(page.getByText("Second feature")).toBeVisible();
    });

    test("should sort featured recipes by feature date", async ({
      page,
      resetData,
    }) => {
      await resetData("three-recipes");

      await page.goto("/recipe/third-recipe");
      await page.getByText("Feature").click();
      await page.getByText("Submit").click();

      await page.goto("/recipe/first-recipe");
      await page.getByText("Feature").click();
      await page.getByText("Submit").click();

      await page.goto("/recipe/second-recipe");
      await page.getByText("Feature").click();
      await page.getByText("Submit").click();

      const featuredItems = page
        .getByText("Featured Recipes")
        .locator("xpath=ancestor::*[1]")
        .getByRole("listitem");
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
      await page.getByText("View Feature").click();
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

      await page.getByText("Delete").click();

      await expect(page).toHaveURL(baseURL + "/");
      await expect(page.getByText("Featured Recipes")).toHaveCount(0);

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

      await expect(page.getByText("Feature")).toBeVisible();
      await expect(page.getByText("Edit")).toBeVisible();
      await expect(page.getByText("Copy")).toBeVisible();
      await expect(page.getByText("Delete")).toBeVisible();
    });

    test("should navigate to featured recipe form with recipe pre-selected when clicking Feature button", async ({
      page,
      baseURL,
    }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Existing Recipe" }),
      ).toBeVisible();

      await page.getByText("Feature").click();

      await expect(page).toHaveURL(
        /\/featured-recipe\/new\?.*recipe=existing-recipe/,
      );

      await page.getByText("Submit").click();

      await expect(page).toHaveURL(baseURL + "/");
      await expect(
        page
          .locator("h2", { hasText: "Featured Recipes" })
          .locator("xpath=ancestor::*[1]")
          .getByText("Existing Recipe"),
      ).toBeVisible();
    });

    test("should allow adding a note when featuring from Feature button", async ({
      page,
      baseURL,
    }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Existing Recipe" }),
      ).toBeVisible();

      await page.getByText("Feature").click();

      await page
        .getByLabel("Note")
        .fill("This recipe was featured from the Feature button");
      await page.getByText("Submit").click();

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
      await expect(page.getByText("Sign in with Credentials")).toBeVisible();
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page }) => {
        await fillSignInForm(page);
      });

      test("should be able to create a featured recipe", async ({
        page,
        baseURL,
      }) => {
        await page.getByText("Submit").click();

        await expect(page).toHaveURL(baseURL + "/");
        await expect(
          page
            .locator("h2", { hasText: "Featured Recipes" })
            .locator("xpath=ancestor::*[1]")
            .getByText("Existing Recipe"),
        ).toBeVisible();
      });

      test("should allow adding a note when creating a featured recipe", async ({
        page,
        baseURL,
      }) => {
        await page
          .getByLabel("Note")
          .fill("This is a test note for the feature");
        await page.getByText("Submit").click();

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
      await page.getByText("View Feature").click();
      await page.getByRole("link", { name: "Edit", exact: true }).click();
    });

    test("should require authentication", async ({ page }) => {
      await expect(page.getByText("Sign in with Credentials")).toBeVisible();
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
        await page.getByText("Submit").click();

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

        await page.getByText("Advanced").click();
        await expect(page.getByLabel("Slug")).toBeVisible();
        await page.getByLabel("Slug").clear();
        const newSlug = "custom-featured-slug";
        await page.getByLabel("Slug").fill(newSlug);
        await page.getByText("Submit").click();

        await expect(page).toHaveURL(baseURL + "/");

        await page.goto("/featured-recipes");
        await page.getByText("View Feature").click();
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
      await page.getByText("Select Recipe").click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByLabel("Query")).toBeVisible();
    });

    test("should search for recipes in modal", async ({ page }) => {
      await expect(page.getByText("New Featured Recipe")).toBeVisible();
      await page.getByText("Select Recipe").click();

      await page.getByLabel("Query").fill("First Recipe");
      await page.getByRole("dialog").getByText("Submit").click();

      await expect(page.getByText(/First Recipe/)).toBeVisible();
      await expect(page.getByText(/Second Recipe/)).toHaveCount(0);
    });

    test("should select recipe from modal and close", async ({ page }) => {
      await page.getByText("Select Recipe").click();

      await expect(page.getByRole("dialog")).toBeAttached();
      await page.getByRole("dialog").getByLabel("Query").fill("Second Recipe");
      await page.getByRole("dialog").getByText("Submit").click();
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
      await page.getByText("Select Recipe").click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Query").fill("First Recipe");
      await dialog.getByText("Submit").click();
      await dialog.getByRole("listitem").getByRole("button").click();
      await expect(page.getByRole("dialog")).toHaveCount(0);

      await page.getByLabel("Note").fill("Featured via modal selection");
      await page.getByText("Submit").click();

      await expect(page).toHaveURL(baseURL + "/");
      await expect(
        page
          .locator("h2", { hasText: "Featured Recipes" })
          .locator("xpath=ancestor::*[1]")
          .getByText(/First Recipe/),
      ).toBeVisible();
    });

    test("should close modal on overlay click", async ({ page }) => {
      await page.getByText("Select Recipe").click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.locator("[data-dialog-overlay]").click({ force: true });

      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("should clear selected recipe", async ({ page }) => {
      await page.getByText("Select Recipe").click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Query").fill("Third Recipe");
      await dialog.getByText("Submit").click();
      await dialog.getByRole("listitem").getByRole("button").click();
      await expect(page.getByText("Selected: Third Recipe")).toBeVisible();

      await page.getByText("Clear").click();
      await expect(page.getByText("Selected: Third Recipe")).toHaveCount(0);
      await expect(page.getByText("Select Recipe")).toBeVisible();
    });

    test("should show no recipes in modal initially", async ({ page }) => {
      await page.getByText("Select Recipe").click();

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
      await expect(page.getByText("Featured Recipes")).toBeVisible();

      await expect(page.getByText("Recipe 15")).toBeVisible();
      await expect(page.getByText("Recipe 4")).toBeVisible();
      await expect(page.getByText("Recipe 3")).toHaveCount(0);

      await expect(
        page.locator("span", { hasText: "1" }).first(),
      ).toBeVisible();

      await expect(page.getByText("→")).toBeVisible();
    });

    test("should navigate to page 2", async ({ page, baseURL, resetData }) => {
      await resetData("many-featured-recipes");

      await page.goto("/featured-recipes");
      await page.getByText("→").click();

      await expect(page).toHaveURL(baseURL + "/featured-recipes/2");

      await expect(page.getByText("Recipe 3")).toBeVisible();
      await expect(page.getByText("Recipe 2")).toBeVisible();
      await expect(page.getByText("Recipe 1")).toBeVisible();

      await expect(
        page.locator("span", { hasText: "2" }).first(),
      ).toBeVisible();

      await expect(page.getByText("→")).toHaveCount(0);
    });

    test("should navigate back from page 2 to unnumbered first page", async ({
      page,
      baseURL,
      resetData,
    }) => {
      await resetData("many-featured-recipes");

      await page.goto("/featured-recipes/2");
      await expect(
        page.locator("span", { hasText: "2" }).first(),
      ).toBeVisible();

      await page.getByText("←").click();

      await expect(page).toHaveURL(baseURL + "/featured-recipes");
      await expect(
        page.locator("span", { hasText: "1" }).first(),
      ).toBeVisible();
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

      await expect(page.getByText("Home")).toBeVisible();
      await expect(page.getByText("←")).toHaveCount(0);
    });
  });
});
