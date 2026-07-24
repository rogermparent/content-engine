import { test, expect } from "../support/test";
import { signIn } from "../support/helpers";
import type { Page } from "@playwright/test";

/** Read an inline CSS custom property set on <html> by the theming layer. */
function inlineVar(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (n) => document.documentElement.style.getPropertyValue(n),
    name,
  );
}

/** Read the computed value of a CSS custom property on <html>. */
function computedVar(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (n) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  );
}

test.describe("Theme editor", () => {
  test("live preview updates tokens for accent, font, radius, and per mode", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/settings");

    await expect(page.getByTestId("theme-preview")).toBeVisible();

    // Accent swatch → light-mode --primary on the fixed contrast curve (hue 150).
    await page.getByRole("button", { name: "Pine", exact: true }).click();
    expect(await inlineVar(page, "--primary")).toBe("oklch(0.53 0.16 150)");

    // Per-mode: flipping the system color scheme re-applies the dark map live.
    await page.emulateMedia({ colorScheme: "dark" });
    await expect
      .poll(() => inlineVar(page, "--primary"))
      .toBe("oklch(0.7 0.16 150)");
    await page.emulateMedia({ colorScheme: "light" });
    await expect
      .poll(() => inlineVar(page, "--primary"))
      .toBe("oklch(0.53 0.16 150)");

    // Font pairing → the display role points at the pairing's registered var.
    await page.getByLabel("Typeface pairing").click();
    await page.getByRole("option", { name: "Modern Grotesk" }).click();
    expect(await inlineVar(page, "--ff-display")).toBe(
      "var(--ff-display-grotesk)",
    );

    // Radius slider → --radius changes off its 0.5rem default via the keyboard.
    const radius = page.getByRole("slider", { name: "Corner radius" });
    await radius.focus();
    await radius.press("ArrowRight");
    await radius.press("ArrowRight");
    expect(await inlineVar(page, "--radius")).not.toBe("0.5rem");
  });

  test("a built-in preset switch updates the tokens", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/settings");

    await page.getByLabel("Preset", { exact: true }).click();
    await page.getByRole("option", { name: "High Contrast" }).click();

    // High Contrast = indigo accent (hue 265) + tight 0.25rem radius.
    expect(await inlineVar(page, "--primary")).toBe("oklch(0.53 0.16 265)");
    expect(await inlineVar(page, "--radius")).toBe("0.25rem");
  });

  test("save persists as site default and injects flash-free SSR style", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/settings");

    await page.getByRole("button", { name: "Pine", exact: true }).click();
    await page
      .getByRole("button", { name: "Save as site default", exact: true })
      .click();
    await expect(page.getByText("Settings saved.")).toBeVisible();

    // Drop the visitor override so the reload can only get its color from the
    // SSR <style> — proves the default is delivered before any JS (no flash).
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const styleTag = page.locator("style[data-theme-default]");
    await expect(styleTag).toHaveCount(1);
    expect(await styleTag.textContent()).toContain("oklch(0.53 0.16 150)");
    // Computed value comes purely from the injected stylesheet, no inline var.
    expect(await inlineVar(page, "--primary")).toBe("");
    expect(await computedVar(page, "--primary")).toBe("oklch(0.53 0.16 150)");
  });

  test("visitor preset selection persists across reload via localStorage", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");

    // Signed-out visitor picks a preset from the header control.
    await page.getByLabel("Theme preset").click();
    await page.getByRole("option", { name: "Cool Steel" }).click();

    await expect
      .poll(() => inlineVar(page, "--primary"))
      .toBe("oklch(0.53 0.16 250)");
    expect(
      await page.evaluate(() => localStorage.getItem("ce-theme-vars")),
    ).not.toBeNull();

    // Reload: the pre-paint script re-applies the stored override, no flash.
    await page.reload();
    await expect
      .poll(() => inlineVar(page, "--primary"))
      .toBe("oklch(0.53 0.16 250)");
  });
});
