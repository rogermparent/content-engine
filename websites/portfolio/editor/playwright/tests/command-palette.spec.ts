import { test, expect } from "../support/test";

/*
 * ⌘K.
 *
 * The corpus is a server-rendered prop, not a fetch from `/search/all` — so
 * these tests never wait on a network round trip, and a palette that opened
 * empty would be a real failure rather than a slow load.
 */
test.describe("Command palette", () => {
  test.beforeEach(async ({ page, resetData }) => {
    await resetData("projects");
    await page.goto("/");
  });

  test("opens with the keyboard shortcut and lists works", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("option").first()).toBeVisible();
  });

  test("opens from the masthead trigger too", async ({ page }) => {
    // The shortcut is an accelerator, not the only way in: the palette has to be
    // reachable by tap and by plain keyboard navigation.
    await page.getByRole("button", { name: "Search works" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("filters works and navigates to the chosen one", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Search works…").fill("recipe");

    const option = dialog.getByRole("option", { name: /Recipe Website/ });
    await expect(option).toBeVisible();
    await option.click();

    await expect(page).toHaveURL(/\/project\/recipe-website$/);
  });

  test("matches a tag, which cmdk's own filter would have dropped", async ({
    page,
  }) => {
    // The reason `shouldFilter={false}` is set: cmdk scores on rendered text, and
    // the tag is not rendered on the row — so a tag-only match would be filtered
    // out before it could ever be shown.
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Search works…").fill("oklch");

    await expect(
      dialog.getByRole("option", { name: /Discontent Design System/ }),
    ).toBeVisible();
  });

  test("says so when nothing matches", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Search works…").fill("zzzzznope");
    await expect(dialog.getByText("No works match.")).toBeVisible();
  });

  test("offers navigation and appearance commands", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog");

    await expect(dialog.getByRole("option", { name: "About" })).toBeVisible();
    await expect(dialog.getByRole("option", { name: "Dark" })).toBeVisible();

    await dialog.getByRole("option", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("Escape closes it", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
