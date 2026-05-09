import { test, expect } from "../support/test";
import { fillSignInForm } from "../support/helpers";

test.describe("Page Editor", () => {
  test.describe("with a clean slate", () => {
    test("should need authorization", async ({ page, resetData }) => {
      await resetData();
      await page.goto("/pages");
      await expect(page.getByText("Sign in with Credentials")).toBeVisible();
    });

    test("should need authorization when directly going to an edit page", async ({
      page,
      resetData,
    }) => {
      await resetData("about-page");
      await page.goto("/pages/edit/about");
      await expect(page.getByText("Sign in with Credentials")).toBeVisible();
    });

    test.describe("when authenticated", () => {
      test.beforeEach(async ({ page, resetData }) => {
        await resetData();
        await page.goto("/pages");
        await fillSignInForm(page);
      });

      test("should be able to add, edit, and remove a page", async ({
        page,
        request,
      }) => {
        await expect(page.getByText("There are no pages yet.")).toBeVisible();

        let response = await request.get("/my-new-page");
        expect(response.status()).toBe(404);

        await page.getByText("New Page").click();

        await expect(page.getByText("Back to Pages")).toBeVisible();

        await page.getByLabel("Name").fill("My New Page");
        await page
          .getByLabel("Content")
          .fill(
            "## Page Subtitle\n\nThis is a new page, *formatted* in **markdown**!",
          );

        await page.getByText("Submit").click();

        await expect(page.getByText(/^This is a new page/)).toBeVisible();
        await expect(page.getByText("formatted")).toBeVisible();
        await expect(page.getByText("markdown")).toBeVisible();

        response = await request.get("/my-new-page");
        expect(response.status()).toBe(200);

        await page.getByRole("link", { name: "Edit", exact: true }).click();

        await page.getByLabel("Name").clear();
        await page.getByLabel("Name").fill("My New Edited Page");
        await page.getByLabel("Content").clear();
        await page
          .getByLabel("Content")
          .fill(
            "## Page Subtitle\n\nThis is an edited page, *formatted* in **markdown**!\n\n- It has a list!\n\n- with two items!",
          );

        await page.getByText("Submit").click();

        await expect(page.getByText(/^This is an edited page/)).toBeVisible();
        await expect(page.getByText("formatted")).toBeVisible();
        await expect(page.getByText("markdown")).toBeVisible();
        await expect(page.getByText("It has a list!")).toBeVisible();
        await expect(page.getByText("with two items!")).toBeVisible();

        await page.getByText("Delete").click();

        await expect(page.getByText("There are no pages yet.")).toBeVisible();

        response = await request.get("/my-new-page");
        expect(response.status()).toBe(404);
      });
    });
  });
});
