import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";
import { snapshotLocator } from "../support/visual";

test.describe("Yield Feature", () => {
  test.beforeEach(async ({ page, resetData }) => {
    await resetData("importable-uploads");
    await page.goto("/new-recipe");
  });

  test.describe("when authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await fillSignInForm(page);
    });

    test("should be able to set a yield with multiplyable number", async ({
      page,
    }) => {
      const newRecipeTitle = "Recipe with Yield";
      const yieldValue = '<Multiplyable baseNumber="12" /> cookies';

      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(newRecipeTitle);

      // The yield field is a Lexical editor; enter raw markdown via Source mode.
      const yieldField = page
        .getByLabel("Yield")
        .locator("xpath=ancestor::*[contains(@class,'border')][1]");
      await yieldField
        .getByRole("button", { name: "Source", exact: true })
        .click();
      await page.getByLabel("Yield source").fill(yieldValue);

      await page.getByRole("button", { name: "Submit", exact: true }).click();

      await expect(
        page.getByRole("heading", { name: newRecipeTitle }),
      ).toBeVisible();

      await expect(
        page
          .getByText("Yield", { exact: true })
          .locator("xpath=ancestor::div[1]")
          .getByText("12 cookies"),
      ).toBeVisible();

      await page.getByLabel("Multiply").clear();
      await page.getByLabel("Multiply").fill("2");
      await expect(
        page
          .getByText("Yield", { exact: true })
          .locator("xpath=ancestor::div[1]")
          .getByText("24 cookies"),
      ).toBeVisible();

      await page.getByLabel("Multiply").clear();
      await page.getByLabel("Multiply").fill("0.5");
      await expect(
        page
          .getByText("Yield", { exact: true })
          .locator("xpath=ancestor::div[1]")
          .getByText("6 cookies"),
      ).toBeVisible();
      await snapshotLocator(
        page
          .getByText("Yield", { exact: true })
          .locator("xpath=ancestor::div[1]"),
        "yield-multiplied-half.png",
      );
    });

    test("should allow using the Multiplyable button in Yield input", async ({
      page,
    }) => {
      const newRecipeTitle = "Recipe with Yield Button";

      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(newRecipeTitle);

      const yieldField = page
        .getByLabel("Yield")
        .locator("xpath=ancestor::*[contains(@class,'border')][1]");

      // Type "12", select it, and turn it into a Multiplyable via the toolbar.
      await page.getByLabel("Yield").click();
      await page.keyboard.type("12");
      await page.keyboard.press("ControlOrMeta+a");
      await yieldField.getByRole("button", { name: "Scaling number" }).click();

      // Verify the serialized markdown via Source mode.
      await yieldField
        .getByRole("button", { name: "Source", exact: true })
        .click();
      await expect(page.getByLabel("Yield source")).toHaveValue(
        '<Multiplyable baseNumber="12" />',
      );
    });
  });
});
