import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";

test.describe("Menu Editor", () => {
  test.describe("with a clean slate", () => {
    test.beforeEach(async ({ page, resetData }) => {
      await resetData();
      await page.goto("/menus");
    });

    test("should need authorization", async ({ page }) => {
      await expect(page.getByText("Sign in with Credentials")).toBeVisible();
    });

    test("should need authorization when directly going to edit the header", async ({
      page,
    }) => {
      await page.goto("/menus/edit/header");
      await expect(page.getByText("Sign in with Credentials")).toBeVisible();
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page }) => {
        await fillSignInForm(page);
      });

      test("should be able to add to, edit, and clear the header nav", async ({
        page,
      }) => {
        await page
          .getByRole("heading", { name: "Header", exact: true })
          .click();
        await page.getByText("Append").click();
        await page.getByLabel("Name").fill("About");
        await page.getByLabel("Href").fill("/about");
        await page.getByText("Submit").click();

        await expect(page.getByText("Menu Editor")).toBeVisible();
        await expect(page.getByText("About")).toHaveAttribute("href", "/about");

        await page
          .getByRole("heading", { name: "Header", exact: true })
          .click();

        await page.getByLabel("Name").clear();
        await page.getByLabel("Name").fill("About Us");
        await page.getByLabel("Href").clear();
        await page.getByLabel("Href").fill("/about-us");
        await page.getByText("Submit").click();

        await expect(page.getByText("Menu Editor")).toBeVisible();
        await expect(page.getByText("About Us")).toHaveAttribute(
          "href",
          "/about-us",
        );

        await page
          .getByRole("heading", { name: "Header", exact: true })
          .click();
        await page.getByText("Delete").click();

        await expect(page.getByText("Menu Editor")).toBeVisible();
        await expect(page.getByText("About")).toHaveCount(0);
      });

      test("should be able to add to, edit, and clear the footer nav", async ({
        page,
      }) => {
        await page
          .getByRole("heading", { name: "Footer", exact: true })
          .click();
        await page.getByText("Append").click();
        await page.getByLabel("Name").fill("About");
        await page.getByLabel("Href").fill("/about");
        await page.getByText("Submit").click();

        await expect(page.getByText("Menu Editor")).toBeVisible();
        await expect(page.getByText("About")).toHaveAttribute("href", "/about");

        await page
          .getByRole("heading", { name: "Footer", exact: true })
          .click();

        await page.getByLabel("Name").clear();
        await page.getByLabel("Name").fill("About Us");
        await page.getByLabel("Href").clear();
        await page.getByLabel("Href").fill("/about-us");
        await page.getByText("Submit").click();

        await expect(page.getByText("Menu Editor")).toBeVisible();
        await expect(page.getByText("About Us")).toHaveAttribute(
          "href",
          "/about-us",
        );

        await page
          .getByRole("heading", { name: "Footer", exact: true })
          .click();
        await page.getByText("Delete").click();

        await expect(page.getByText("Menu Editor")).toBeVisible();
        await expect(page.getByText("About")).toHaveCount(0);
      });
    });
  });
});
