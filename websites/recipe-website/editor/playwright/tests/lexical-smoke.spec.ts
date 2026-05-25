import { test, expect } from "../support/test";
import { signIn } from "../support/helpers";

test.describe("Lexical editor smoke @lexical", () => {
  test("description editor renders, and markdown round-trips through rich mode", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/new-recipe");

    // The rich editor's contenteditable should be present.
    await expect(page.getByLabel("Description")).toBeVisible();

    // Scope to the Description field (other fields are also Lexical editors).
    const descField = page
      .locator('input[type=hidden][name="description"]')
      .locator("xpath=..");

    // Switch to source mode and enter markdown with a custom tag.
    await descField.getByRole("button", { name: "Source" }).click();
    const source = page.getByLabel("Description source");
    await expect(source).toBeVisible();
    const input = 'Hello **world** <Multiplyable baseNumber="2" /> cups';
    await source.fill(input);

    // Hidden FormData input mirrors the source.
    await expect(
      page.locator('input[type=hidden][name="description"]'),
    ).toHaveValue(input);

    // Toggle to rich (parses markdown) then back to source (re-serializes).
    await descField.getByRole("button", { name: "Editor" }).click();
    await expect(page.getByLabel("Description")).toBeVisible();
    await descField.getByRole("button", { name: "Source" }).click();

    const roundTripped = await page
      .getByLabel("Description source")
      .inputValue();
    expect(roundTripped).toContain("**world**");
    expect(roundTripped).toContain('<Multiplyable baseNumber="2" />');
  });
});
