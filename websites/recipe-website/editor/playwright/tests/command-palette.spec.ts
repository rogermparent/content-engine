import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "../support/test";
import { signIn } from "../support/helpers";
import { snapshotLocator } from "../support/visual";

const PLACEHOLDER = /Search recipes/;
const WCAG = ["wcag2a", "wcag2aa"];

/** The palette dialog, keyed by its sr-only DialogTitle. */
function palette(page: Page) {
  return page.getByRole("dialog", { name: "Command palette" });
}

/** Open via the desktop header trigger and wait for the input to focus. */
async function openViaTrigger(page: Page) {
  const trigger = page.getByRole("button", { name: "Search" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeVisible();
}

/**
 * Sign in, then land back on a fully-loaded home page. The redirect after the
 * credentials submit can still be in flight, so navigate explicitly (the same
 * `signIn(); goto()` pattern the settings specs use) before driving the palette.
 */
async function signInAndHome(page: Page) {
  await page.goto("/");
  await signIn(page);
  await page.goto("/");
}

test.describe("Command palette", () => {
  test.beforeEach(async ({ resetData }) => {
    await resetData("three-recipes");
  });

  test("opens from the header trigger with an accessible title", async ({
    page,
  }) => {
    await page.goto("/");
    // The ⌘K hint chip is decorative (aria-hidden) — the trigger's name is "Search".
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

    await openViaTrigger(page);
    // Radix names the dialog from the sr-only DialogTitle (and marks the rest of
    // the page inert while it's open).
    await expect(palette(page)).toBeVisible();
  });

  test("toggles open with the ⌘K / Ctrl-K shortcut", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveCount(0);

    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder(PLACEHOLDER)).toBeVisible();

    // The same chord toggles it back closed.
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveCount(0);
  });

  test("live search surfaces a recipe and Enter navigates to it", async ({
    page,
  }) => {
    await page.goto("/");
    await openViaTrigger(page);

    await page.getByPlaceholder(PLACEHOLDER).fill("First");

    // The index mounts + populates from /search/all + /search/version, then the
    // debounced query resolves — give it room on a cold IndexedDB.
    const row = page.getByRole("option", { name: /First Recipe/ });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // cmdk auto-selects the top row, so Enter opens it.
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/recipe\/first-recipe$/);
  });

  test("Enter opens the top recipe even when the query matches a destination", async ({
    page,
  }) => {
    await page.goto("/");
    await openViaTrigger(page);

    // "Recipe" matches nav items ("All recipes", the Search destination) too, but
    // the top recipe row must stay selected so Enter opens a recipe, not /search.
    await page.getByPlaceholder(PLACEHOLDER).fill("Recipe");
    await expect(
      page.getByRole("option", { name: /Recipe/ }).first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/recipe\/[a-z-]+$/);
  });

  test("shows owner destinations when signed in", async ({ page }) => {
    await signInAndHome(page);
    await openViaTrigger(page);

    await expect(
      page.getByRole("option", { name: "New Recipe" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Content Sync" }),
    ).toBeVisible();
    // The editor-injected auth action reads "Sign out" when signed in.
    await expect(page.getByRole("option", { name: "Sign out" })).toBeVisible();
  });

  test("hides owner destinations for a signed-out reader", async ({ page }) => {
    await page.goto("/");
    await openViaTrigger(page);

    // Reader (no session) → owner-only items are structurally absent.
    await expect(page.getByRole("option", { name: "New Recipe" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("option", { name: "Content Sync" }),
    ).toHaveCount(0);
    // Reader destinations are present.
    await expect(page.getByRole("option", { name: "Bookmarks" })).toBeVisible();
  });

  test("navigates via a 'Go to' destination", async ({ page }) => {
    await signInAndHome(page);
    await openViaTrigger(page);

    // "Site details" is the palette's entry for /settings (mirrors SettingsNav).
    await page.getByRole("option", { name: "Site details" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("closes on route change", async ({ page }) => {
    await page.goto("/");
    await openViaTrigger(page);
    await page.getByRole("option", { name: "Bookmarks" }).click();
    await expect(page).toHaveURL(/\/bookmarks$/);
    await expect(palette(page)).toHaveCount(0);
  });

  test("open palette has no WCAG2AA violations", async ({ page }) => {
    await page.goto("/");
    await openViaTrigger(page);
    await expect(palette(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Command palette visuals", () => {
  test.beforeEach(async ({ resetData }) => {
    await resetData("three-recipes");
  });

  for (const mode of ["light", "dark"] as const) {
    test(`empty palette in ${mode} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode });
      await page.goto("/");
      await openViaTrigger(page);
      await snapshotLocator(palette(page), `palette-empty-${mode}.png`);
    });
  }

  test("palette with recipe results", async ({ page }) => {
    await page.goto("/");
    await openViaTrigger(page);
    await page.getByPlaceholder(PLACEHOLDER).fill("Recipe");
    await expect(
      page.getByRole("option", { name: /First Recipe/ }),
    ).toBeVisible({ timeout: 15_000 });
    await snapshotLocator(palette(page), "palette-results-light.png");
  });

  test("owner palette exposes owner destinations", async ({ page }) => {
    await signInAndHome(page);
    await openViaTrigger(page);
    await expect(
      page.getByRole("option", { name: "New Recipe" }),
    ).toBeVisible();
    await snapshotLocator(palette(page), "palette-owner-light.png");
  });
});

test.describe("Command palette @mobile", () => {
  test.beforeEach(async ({ resetData }) => {
    await resetData("three-recipes");
  });

  test("opens from the mobile nav sheet with no keyboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    // Tapping Search closes the sheet and opens the palette (no ⌘K hint here).
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Search" })
      .click();

    await expect(page.getByPlaceholder(PLACEHOLDER)).toBeVisible();

    await page.getByPlaceholder(PLACEHOLDER).fill("First");
    await expect(
      page.getByRole("option", { name: /First Recipe/ }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
