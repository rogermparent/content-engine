/**
 * Fixture Generation Spec
 *
 * Generates the test fixtures used by other tests.
 * Run explicitly with `pnpm generate-fixtures`; not part of the normal suite.
 */

import { test, expect } from "../support/test";
import { fillMarkdownField, fillSignInForm } from "../support/helpers";

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

  /**
   * `search-corpus` — the fixture the search specs exercise. Purpose-built, and
   * additive: nothing else reads it, so its recipe counts are free to change
   * without disturbing the older fixtures' assertions.
   *
   * It carries, deliberately:
   *  - an accented name (Crème Brûlée) for the encoder's diacritic folding,
   *  - descriptions, so the description field is actually in the index,
   *  - a term that appears **only** in a description (pomegranate),
   *  - a term that is a name on one recipe and an ingredient on another
   *    (ginger), pinning the native field-priority ranking,
   *  - and enough filler to overflow the results grid's 60-card reveal cap.
   */
  test("generates search-corpus fixture", async ({
    page,
    resetData,
    copyFixtures,
  }) => {
    // ~70 form round-trips; well past the default per-test timeout.
    test.setTimeout(900_000);

    await resetData();
    await page.goto("/new-recipe");
    await fillSignInForm(page);

    const submitRecipe = async (name: string) => {
      await page.getByText("Submit").click();
      await expect(
        page.getByRole("heading", { level: 1, name, exact: true }),
      ).toBeVisible({ timeout: 20_000 });
    };

    const addTag = async (tag: string) => {
      const input = page.getByLabel("Add a tag");
      await input.fill(tag);
      await input.press("Enter");
      await expect(
        page.getByRole("button", { name: `Remove tag ${tag}` }),
      ).toBeVisible();
    };

    const createRecipe = async (recipe: {
      name: string;
      slug: string;
      description?: string;
      tags?: string[];
      ingredients?: string[];
    }) => {
      await page.goto("/new-recipe");
      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(recipe.name);
      await page.getByLabel("Slug").clear();
      await page.getByLabel("Slug").fill(recipe.slug);

      if (recipe.description) {
        // Description is a Lexical WYSIWYG; drive it through the sanctioned
        // Source-mode helper rather than fill()ing the contenteditable.
        await fillMarkdownField(page, "description", recipe.description);
      }

      for (const tag of recipe.tags ?? []) await addTag(tag);

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        await page.getByText("Paste Ingredients", { exact: true }).click();
        await page
          .getByTitle("Ingredients Paste Area")
          .fill(recipe.ingredients.join("\n"));
        await page.getByText("Import Ingredients", { exact: true }).click();
      }

      await submitRecipe(recipe.name);
    };

    await createRecipe({
      name: "Crème Brûlée",
      slug: "creme-brulee",
      description:
        "A classic French custard baked slow and low, finished under a blowtorch for a caramelized sugar crust.",
      tags: ["dessert", "french"],
      ingredients: ["2 cups heavy cream", "1/2 cup sugar", "6 egg yolks"],
    });

    await createRecipe({
      name: "Chocolate Truffle Cake",
      slug: "chocolate-truffle-cake",
      description:
        "A dense flourless chocolate cake with a molten center, best served slightly warm.",
      tags: ["dessert", "chocolate"],
      ingredients: ["200 g dark chocolate", "4 eggs", "1/2 cup butter"],
    });

    await createRecipe({
      name: "Tomato Basil Soup",
      slug: "tomato-basil-soup",
      description:
        "Slow-roasted tomatoes blended smooth with fresh basil and a splash of cream.",
      tags: ["soup"],
      ingredients: ["6 ripe tomatoes", "1 bunch basil", "1 cup cream"],
    });

    await createRecipe({
      name: "Sourdough Loaf",
      slug: "sourdough-loaf",
      description:
        "A slow-fermented country loaf with a blistered crust and an open, custardy crumb.",
      tags: ["bread", "baked"],
      ingredients: ["500 g bread flour", "1 cup starter", "10 g salt"],
    });

    // "pomegranate" lives only in this description — nowhere in any name, tag,
    // or ingredient — so finding it proves the description field is indexed.
    await createRecipe({
      name: "Weeknight Skillet",
      slug: "weeknight-skillet",
      description:
        "A brisk one-pan supper glazed with pomegranate molasses and finished with herbs.",
      tags: ["quick"],
      ingredients: ["2 chicken thighs", "1 onion", "1 tbsp olive oil"],
    });

    // Ranking pair: "ginger" is a *name* hit here…
    await createRecipe({
      name: "Ginger Cookies",
      slug: "ginger-cookies",
      description: "Chewy spiced cookies with crackled tops and a sugar crust.",
      tags: ["dessert", "baked"],
      ingredients: ["2 cups flour", "1 cup molasses", "1 tsp cinnamon"],
    });

    // …and an *ingredient-only* hit here, so the name hit must sort first.
    await createRecipe({
      name: "Carrot Slaw",
      slug: "carrot-slaw",
      description: "A bright raw salad dressed with rice vinegar and sesame.",
      tags: ["salad", "quick"],
      ingredients: ["4 carrots", "1 tbsp grated ginger", "2 tbsp rice vinegar"],
    });

    // Filler: no description, tags, or ingredients — pure volume, so the browse
    // view overflows the 60-card cap (7 rich + 60 filler = 67).
    for (let i = 1; i <= 60; i++) {
      await createRecipe({
        name: `Pantry Staple ${i}`,
        slug: `pantry-staple-${i}`,
      });
    }

    await page.goto("/search");
    await expect(page.getByTestId("search-ticker")).toHaveText(
      /ALL 67 RECIPES/i,
      { timeout: 30_000 },
    );

    await copyFixtures("search-corpus");
  });
});
