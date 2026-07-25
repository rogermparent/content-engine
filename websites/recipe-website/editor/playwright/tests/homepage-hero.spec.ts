import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "../support/test";
import { fillSignInForm, fillMarkdownField } from "../support/helpers";
import { fixturePath } from "../support/tasks";

async function gotoNewRecipe(page: Page): Promise<void> {
  await page.goto("/new-recipe");
  const heading = page.getByRole("heading", { name: "New Recipe" });
  const signIn = page.getByRole("button", {
    name: "Sign in with Credentials",
    exact: true,
  });
  await expect(heading.or(signIn).first()).toBeVisible();
  if (await signIn.isVisible()) {
    await fillSignInForm(page);
    await expect(heading).toBeVisible();
  }
}

async function addTag(page: Page, tag: string): Promise<void> {
  const input = page.getByLabel("Add a tag");
  await input.fill(tag);
  await input.press("Enter");
  await expect(
    page.getByRole("button", { name: `Remove tag ${tag}` }),
  ).toBeVisible();
}

test.describe("Homepage — Working Bench hero", () => {
  test.beforeEach(async ({ resetData }) => {
    await resetData();
  });

  test("the hero renders the featured recipe's photo, live scaler, browse chips, and timeline strip", async ({
    page,
  }) => {
    // Seed one fully-loaded recipe: with no featured recipes it becomes the
    // hero via the latest-recipe fallback, exercising the whole live panel.
    await gotoNewRecipe(page);
    await page.getByLabel("Name").first().clear();
    await page.getByLabel("Name").first().fill("Sourdough Loaf");

    await addTag(page, "bread");

    await page.getByText("Paste Ingredients", { exact: true }).click();
    await page
      .getByTitle("Ingredients Paste Area")
      .fill(["1 cup flour", "2 eggs", "1 tsp salt", "3 tbsp water"].join("\n"));
    await page.getByText("Import Ingredients", { exact: true }).click();

    await fillMarkdownField(page, "recipeYield", "4 servings");

    await page
      .getByRole("button", { name: "Add Timeline", exact: true })
      .click();
    await page.locator('[name="timelines[0].name"]').fill("Bake Day");
    await page
      .getByRole("button", { name: "Add Timeline Event", exact: true })
      .click();
    await page.locator('[name="timelines[0].events[0].name"]').fill("Rise");
    await page
      .locator('[name="timelines[0].events[0].defaultLength.minutes"]')
      .fill("120");

    await page.getByLabel("Image", { exact: true }).setInputFiles({
      name: "hero.png",
      mimeType: "image/png",
      buffer: readFileSync(fixturePath("images", "recipe-6-test-image.png")),
    });

    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Sourdough Loaf" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/");

    // The hero is a labeled region ("Latest recipe" on the fallback path).
    const hero = page.getByRole("region", { name: "Latest recipe" });
    await expect(hero).toBeVisible();
    await expect(
      hero.getByRole("heading", { name: "Sourdough Loaf" }),
    ).toBeVisible();
    await expect(hero.getByRole("img")).toBeVisible();

    // Yield renders, and the first ingredient's quantity shows at scale 1.
    await expect(hero.getByText("4 servings")).toBeVisible();
    await expect(hero.getByText("1 cup flour")).toBeVisible();

    // Scaling in place: typing 2 doubles the displayed quantities.
    await hero.getByLabel("Multiply").fill("2");
    await expect(hero.getByText("2 cup flour")).toBeVisible();
    await expect(hero.getByText("1 cup flour")).toHaveCount(0);

    // The timeline strip shows a labeled segment.
    await expect(hero.getByText("Rise")).toBeVisible();
    await expect(hero.getByText("2h", { exact: true }).first()).toBeVisible();

    // A browse chip links to the tag-filtered search.
    await expect(
      page.getByRole("link", { name: "bread", exact: true }),
    ).toHaveAttribute("href", "/search?tags=bread");

    // The rich hero (image, scale input, chips, timeline) stays WCAG2AA-clean.
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
  });
});
