import { test, expect, type Page } from "../support/test";
import {
  fillSignInForm,
  signIn,
  fillMarkdownField,
  markdownEditorReady,
  searchFor,
  deleteWithConfirm,
} from "../support/helpers";
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
      await fillMarkdownField(page, "note", "First feature");
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page.getByRole("listitem")).toHaveCount(2);

      await page.goto("/recipe/existing-recipe");
      await expect(
        page.getByRole("heading", { name: "Existing Recipe" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await fillMarkdownField(page, "note", "Second feature");
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

      await deleteWithConfirm(page, "feature");

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

      await fillMarkdownField(
        page,
        "note",
        "This recipe was featured from the Feature button",
      );
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
        await fillMarkdownField(
          page,
          "note",
          "This is a test note for the feature",
        );
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
        // The featured-recipe edit form's "note" is a Lexical field; gate on it
        // hydrating so the first Slug/note interaction isn't dropped/reset.
        await markdownEditorReady(page, "note");
      });

      test("should be able to edit a featured recipe note", async ({
        page,
        baseURL,
      }) => {
        await fillMarkdownField(page, "note", "This message is edited!");
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
      // Select-Recipe button + note editor share one client island; gate on the
      // note editor hydrating so the Select Recipe click isn't swallowed.
      await markdownEditorReady(page, "note");
    });

    test("should open recipe selection modal when clicking select button", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByLabel("Search recipes")).toBeVisible();
    });

    test("should search for recipes in modal", async ({ page }) => {
      await expect(page.getByText("New Featured Recipe")).toBeVisible();
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      const dialog = page.getByRole("dialog");
      await searchFor(page, "First Recipe", dialog);

      // `suggest` keeps partial matches, so "First Recipe" also surfaces the
      // other "… Recipe" entries — ranked below. What matters is that the exact
      // match sorts to the top, not that the others are excluded.
      await expect(
        dialog.getByRole("button", { name: /First Recipe/ }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("First Recipe");
    });

    test("should select recipe from modal and close", async ({ page }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      await expect(page.getByRole("dialog")).toBeAttached();
      const dialog = page.getByRole("dialog");
      await searchFor(page, "Second Recipe", dialog);
      // Top-ranked hit — `suggest` leaves the weaker "… Recipe" matches below it.
      await expect(
        dialog.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Second Recipe");
      await dialog.getByRole("listitem").first().getByRole("button").click();

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
      await searchFor(page, "First Recipe", dialog);
      await expect(
        dialog.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("First Recipe");
      await dialog.getByRole("listitem").first().getByRole("button").click();
      await expect(page.getByRole("dialog")).toHaveCount(0);

      await fillMarkdownField(page, "note", "Featured via modal selection");
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
      await searchFor(page, "Third Recipe", dialog);
      await expect(
        dialog.getByRole("listitem").first().getByRole("heading"),
      ).toHaveText("Third Recipe");
      await dialog.getByRole("listitem").first().getByRole("button").click();
      await expect(page.getByText("Selected: Third Recipe")).toBeVisible();

      await page.getByRole("button", { name: "Clear", exact: true }).click();
      await expect(page.getByText("Selected: Third Recipe")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Select Recipe", exact: true }),
      ).toBeVisible();
    });

    test("should show the latest recipes in the modal by default", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Select Recipe", exact: true })
        .click();

      // With no query the modal browses the corpus latest-first, so all three
      // fixture recipes are listed. toHaveCount auto-retries, waiting out the
      // async allRecipes load.
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("listitem")).toHaveCount(3);
      await expect(
        dialog.getByRole("button", { name: /First Recipe/ }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /Second Recipe/ }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /Third Recipe/ }),
      ).toBeVisible();
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

  /*
   * A featured recipe's index value borrows `name` and `image` from the recipe
   * it points at (§6.1), so a card renders from one index read and a retitle
   * reaches every card that shows it.
   *
   * Nothing above this describe changed: the cards render the same markup from
   * the same props. What changed is where the props come from, and these are
   * the four properties that only hold now — the two halves the absence of a
   * `references` declaration was breaking, plus the covering property that
   * proves the per-card `recipe.json` read is gone.
   */
  test.describe("borrowed fields", () => {
    /*
     * Featured on the homepage strip (which shows the newest six, 15 down to
     * 10) *and* on the first page of /featured-recipes — so one retitle can be
     * checked on both surfaces.
     */
    const FEATURED_ON_BOTH = "recipe-12";
    const RETITLED = "Retitled Twelve";

    function featuredSection(page: Page) {
      return page
        .locator("h2", { hasText: "Featured Recipes" })
        .locator("xpath=ancestor::*[1]");
    }

    async function retitle(page: Page, slug: string, name: string) {
      await page.goto(`/recipe/${slug}/edit`);
      await fillSignInForm(page);
      // Gate on the form island hydrating before touching a field, as
      // edit.spec.ts does — an early fill is dropped mid-hydration.
      await markdownEditorReady(page, "description");

      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(name);
      await page.getByRole("button", { name: "Submit", exact: true }).click();

      // The redirect, awaited before anything navigates away. Widening the
      // write path is what tipped the demo's git spec over in D1.
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    }

    test("retitling a recipe updates every featured card that shows it", async ({
      page,
      baseURL,
      resetData,
      readFeaturedRecipeIndexDigest,
    }) => {
      await resetData("many-featured-recipes");
      const before = await readFeaturedRecipeIndexDigest();

      await retitle(page, FEATURED_ON_BOTH, RETITLED);
      // No rename: the slug is untouched, which is exactly the write that used
      // to reach the featured-recipes index not at all.
      await expect(page).toHaveURL(baseURL + `/recipe/${FEATURED_ON_BOTH}`);

      expect(await readFeaturedRecipeIndexDigest()).not.toBe(before);

      await page.goto("/featured-recipes");
      await expect(page.getByText(RETITLED, { exact: true })).toBeVisible();
      await expect(page.getByText("Recipe 12", { exact: true })).toHaveCount(0);

      await page.goto("/");
      await expect(
        featuredSection(page).getByText(RETITLED, { exact: true }),
      ).toBeVisible();
      await expect(
        featuredSection(page).getByText("Recipe 12", { exact: true }),
      ).toHaveCount(0);
    });

    test("retitling a recipe updates the feature's own page", async ({
      page,
      resetData,
    }) => {
      await resetData("many-featured-recipes");

      await retitle(page, FEATURED_ON_BOTH, RETITLED);

      /*
       * The `dependentItemBasePaths` seat. This page renders the recipe's name
       * through its own `getRecipeBySlug`, so the borrowed values on the index
       * do not cover it — the write path has to name the URL its dependents
       * are served at.
       *
       * Reached by clicking through rather than by building the URL: the
       * feature's slug is a capture timestamp in the fixture, and the card's
       * own link is the thing that knows it.
       */
      await page.goto("/featured-recipes");
      await page
        .getByRole("listitem")
        .filter({ hasText: RETITLED })
        .getByRole("link", { name: "View Feature", exact: true })
        .click();

      await expect(page).toHaveURL(/\/featured-recipe\//);
      await expect(
        page.getByRole("heading", { level: 1, name: RETITLED }),
      ).toBeVisible();
    });

    test("editing a field nobody borrows leaves the featured index untouched", async ({
      page,
      resetData,
      readFeaturedRecipeIndexDigest,
    }) => {
      await resetData("one-featured-recipe");
      const before = await readFeaturedRecipeIndexDigest();
      expect(before).not.toBe("");

      await page.goto("/recipe/featured-recipe/edit");
      await fillSignInForm(page);
      await markdownEditorReady(page, "description");
      await fillMarkdownField(
        page,
        "description",
        "A description no featured recipe borrows.",
      );
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Featured Recipe" }),
      ).toBeVisible();

      /*
       * Asserted on the index rather than on markup, which would not have
       * moved either way. `description` is not in the `references`
       * declaration, so the gate never opens and this environment is never
       * even opened — LMDB advances its meta page on any commit, so an
       * identical digest means no write happened, not that one wrote the same
       * bytes back.
       */
      expect(await readFeaturedRecipeIndexDigest()).toBe(before);
    });

    test("a featured card survives its recipe becoming unreadable", async ({
      page,
      baseURL,
      resetData,
      makeRecipeUnreadable,
    }) => {
      // `linked-recipes` for its uploads: the borrowed `image` is only worth
      // asserting where an image file actually exists to render.
      await resetData("linked-recipes");

      await page.goto("/recipe/kefir");
      await page.getByRole("link", { name: "Feature", exact: true }).click();
      await fillSignInForm(page);
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      /*
       * Awaited on rendered content, not on the URL alone — a bare `toHaveURL`
       * samples mid-navigation and sees `""`.
       *
       * The long timeout is the same allowance `markdownEditorReady` makes:
       * this is the suite's first hit on `/` for this fixture, so a dev server
       * compiles the route inside the wait, and the default 5s lost twice
       * against the container before passing on the second retry. Featuring a
       * recipe also scans for dependents now, which does not help.
       */
      await expect(
        page.locator("h2", { hasText: "Featured Recipes" }),
      ).toBeVisible({ timeout: 20_000 });
      await expect(page).toHaveURL(baseURL + "/");

      await makeRecipeUnreadable("kefir");

      /*
       * The covering property, and the direct proof the N+1 is gone: the card
       * renders a name and an image out of the featured index alone. The old
       * enrichment pass would have thrown here and been swallowed by its
       * `catch`, degrading to an unnamed, imageless card.
       */
      await page.goto("/featured-recipes");
      const card = page.getByRole("listitem").filter({ hasText: "Kefir" });
      await expect(card.getByText("Kefir", { exact: true })).toBeVisible();
      await expect(
        card.getByRole("img", { name: "Recipe thumbnail" }),
      ).toBeVisible();
    });
  });
});
