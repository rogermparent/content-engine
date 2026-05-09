import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";

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

      await page.getByLabel("Yield").fill(yieldValue);

      await page.getByText("Submit").click();

      await expect(
        page.getByRole("heading", { name: newRecipeTitle }),
      ).toBeVisible();

      await expect(
        page
          .getByText("Yield")
          .locator("xpath=ancestor::div[1]")
          .getByText("12 cookies"),
      ).toBeVisible();

      await page.getByLabel("Multiply").clear();
      await page.getByLabel("Multiply").fill("2");
      await expect(
        page
          .getByText("Yield")
          .locator("xpath=ancestor::div[1]")
          .getByText("24 cookies"),
      ).toBeVisible();

      await page.getByLabel("Multiply").clear();
      await page.getByLabel("Multiply").fill("0.5");
      await expect(
        page
          .getByText("Yield")
          .locator("xpath=ancestor::div[1]")
          .getByText("6 cookies"),
      ).toBeVisible();
    });

    test("should allow using the Multiplyable button in Yield input", async ({
      page,
    }) => {
      const newRecipeTitle = "Recipe with Yield Button";

      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(newRecipeTitle);

      await page.getByLabel("Yield").clear();
      await page.getByLabel("Yield").fill("12 cookies");

      await page.getByLabel("Yield").evaluate((el: HTMLInputElement) => {
        el.setSelectionRange(0, 2);
      });

      await page
        .getByLabel("Yield")
        .locator("xpath=ancestor::*[2]")
        .getByText("×")
        .click();

      await expect(page.getByLabel("Yield")).toHaveValue(
        '<Multiplyable baseNumber="12" /> cookies',
      );
    });
  });
});
