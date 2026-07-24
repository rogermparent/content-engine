import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../support/test";
import { signIn } from "../support/helpers";
import {
  PRESETS,
  resolveThemeVarMaps,
  THEME_VARS_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@discontent/component-library/theming";

const TAGS = ["wcag2a", "wcag2aa"];

test.describe("Accessibility (axe)", () => {
  test("homepage with recipes has no WCAG2AA violations", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("recipe detail page has no WCAG2AA violations", async ({
    page,
    resetData,
  }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("search page has no WCAG2AA violations", async ({ page, resetData }) => {
    await resetData("three-recipes");
    await page.goto("/search");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("bookmarks empty state has no WCAG2AA violations", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/bookmarks");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("featured-recipes listing has no WCAG2AA violations", async ({
    page,
    resetData,
  }) => {
    await resetData("many-featured-recipes");
    await page.goto("/featured-recipes");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("sign-in form has no WCAG2AA violations", async ({
    page,
    resetData,
  }) => {
    test.fail(
      true,
      "#submitButton has color contrast 3.88 against #157efb; needs >= 4.5",
    );
    await resetData();
    await page.goto("/");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: "Sign in with Credentials",
        exact: true,
      }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("new-recipe form has no WCAG2AA violations when signed in", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/new-recipe");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});

// The derivation curve fixes accent lightness/chroma (and neutral lightnesses),
// so any accent/neutral choice must keep the palette WCAG2AA. Verify a few
// built-in presets applied as a visitor override (localStorage + pre-paint).
test.describe("Accessibility across themes (axe)", () => {
  for (const key of ["cool-steel", "evergreen", "high-contrast"]) {
    const preset = PRESETS.find((p) => p.key === key)!;
    test(`homepage stays WCAG2AA under the ${key} preset`, async ({
      page,
      resetData,
    }) => {
      await resetData("three-recipes");
      await page.addInitScript(
        ([vars, theme, varsKey, themeKey]) => {
          localStorage.setItem(varsKey, vars);
          localStorage.setItem(themeKey, theme);
        },
        [
          JSON.stringify(resolveThemeVarMaps(preset.theme)),
          JSON.stringify(preset.theme),
          THEME_VARS_STORAGE_KEY,
          THEME_STORAGE_KEY,
        ] as const,
      );
      await page.goto("/");
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
