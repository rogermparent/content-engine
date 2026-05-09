import { test, expect } from "../support/test";
import { checkNamesInOrder, fillSignInForm } from "../support/helpers";

test.describe("Git content", () => {
  test.describe("when empty", () => {
    test.describe("Git remote management", () => {
      test("should allow creating a new remote", async ({
        page,
        resetData,
        initializeContentGit,
      }) => {
        await resetData();
        await initializeContentGit();
        await page.goto("/git");
        await fillSignInForm(page);

        await page.getByText("New Remote").click();
        await page.getByLabel("Remote Name").fill("origin");
        await page
          .getByLabel("Remote URL")
          .fill("https://github.com/user/repo.git");
        await page.getByText("Add").click();

        await expect(page.getByText("origin")).toBeVisible();
        await expect(
          page.getByText("https://github.com/user/repo.git"),
        ).toBeVisible();
      });

      test("should display an error message when creating a remote with an empty name", async ({
        page,
        resetData,
        initializeContentGit,
      }) => {
        await resetData();
        await initializeContentGit();
        await page.goto("/git");
        await fillSignInForm(page);

        await page.getByText("New Remote").click();
        await page
          .getByLabel("Remote URL")
          .fill("https://github.com/user/repo.git");
        await page.getByText("Add").click();

        await expect(page.getByText("Remote Name is required")).toBeVisible();
      });

      test("should display an error message when creating a remote with an empty URL", async ({
        page,
        resetData,
        initializeContentGit,
      }) => {
        await resetData();
        await initializeContentGit();
        await page.goto("/git");
        await fillSignInForm(page);

        await page.getByText("New Remote").click();
        await page.getByLabel("Remote Name").fill("origin");
        await page.getByText("Add").click();

        await expect(page.getByText("Remote URL is required")).toBeVisible();
      });

      test("should display an error message when creating a remote with a duplicate name", async ({
        page,
        resetData,
        initializeContentGit,
      }) => {
        await resetData();
        await initializeContentGit();
        await page.goto("/git");
        await fillSignInForm(page);

        await page.getByText("New Remote").click();
        await page.getByLabel("Remote Name").fill("origin");
        await page
          .getByLabel("Remote URL")
          .fill("https://github.com/user/repo.git");
        await page.getByText("Add").click();

        await expect(page.getByText("origin")).toBeVisible();

        await page.getByLabel("Remote Name").fill("origin");
        await page
          .getByLabel("Remote URL")
          .fill("https://github.com/user/repo2.git");
        await page.getByText("Add").click();

        await expect(
          page.getByText("error: remote origin already exists."),
        ).toBeVisible();
      });
    });

    test("should navigate to the Git UI from home and create a branch", async ({
      page,
      resetData,
      initializeContentGit,
    }) => {
      await resetData();
      await initializeContentGit();
      await page.goto("/");

      await page.getByText("Settings").click();
      await fillSignInForm(page);
      await page.getByText("Git").click();

      await page.getByLabel("Branch Name").fill("other-branch");
      await page.getByText("Create").click();
      await expect(page.getByText("Branches")).toBeVisible();
      await expect(page.getByText("other-branch")).toBeVisible();
    });

    test("should initialize a Git repository", async ({ page, resetData }) => {
      await resetData();
      await page.goto("/git");
      await fillSignInForm(page);

      await expect(
        page.getByText("Content directory is not tracked with Git."),
      ).toBeVisible();

      await page.getByText("Initialize").click();
      await expect(
        page.getByText("Content directory is not tracked with Git."),
      ).toHaveCount(0);
      await expect(page.getByText("Branches")).toBeVisible();
    });

    test("should display an error message when creating a branch with an empty name", async ({
      page,
      resetData,
      initializeContentGit,
    }) => {
      await resetData();
      await initializeContentGit();
      await page.goto("/git");
      await fillSignInForm(page);

      await page.getByText("Create").click();

      await expect(page.getByText("Branch Name is required")).toBeVisible();
    });

    test("should display an error message when using checkout with no selected branch", async ({
      page,
      resetData,
      initializeContentGit,
    }) => {
      await resetData();
      await initializeContentGit();
      await page.goto("/git");
      await fillSignInForm(page);

      await expect(page.getByRole("radio")).not.toBeChecked();

      await expect(page.getByText("Checkout")).toBeDisabled();
      await page.getByText("Checkout").evaluate((el: HTMLButtonElement) => {
        el.disabled = false;
      });
      await page.getByText("Checkout").click({ force: true });

      await expect(page.getByText("Invalid branch")).toBeVisible();
    });

    test("should display an error message when using delete with no selected branch", async ({
      page,
      resetData,
      initializeContentGit,
    }) => {
      await resetData();
      await initializeContentGit();
      await page.goto("/git");
      await fillSignInForm(page);

      await expect(page.getByRole("radio")).not.toBeChecked();

      await expect(page.getByText("Delete")).toBeDisabled();
      await page.getByText("Delete").evaluate((el: HTMLButtonElement) => {
        el.disabled = false;
      });
      await page.getByText("Delete").click({ force: true });

      await expect(page.getByText("Invalid branch")).toBeVisible();
    });

    test("should display an error message when using force delete with no selected branch", async ({
      page,
      resetData,
      initializeContentGit,
    }) => {
      await resetData();
      await initializeContentGit();
      await page.goto("/git");
      await fillSignInForm(page);

      await expect(page.getByRole("radio")).not.toBeChecked();

      await expect(page.getByText("Force Delete")).toBeDisabled();
      await page.getByText("Force Delete").evaluate((el: HTMLButtonElement) => {
        el.disabled = false;
      });
      await page.getByText("Force Delete").click({ force: true });

      await expect(page.getByText("Invalid branch")).toBeVisible();
    });

    test("should indicate when the content directory is not tracked by git", async ({
      page,
      resetData,
    }) => {
      await resetData();
      await page.goto("/git");
      await fillSignInForm(page);

      await expect(
        page.getByText("Content directory is not tracked with Git."),
      ).toBeVisible();
      await expect(page.getByText("Branches")).toHaveCount(0);
    });

    test("should be able to work with a git-tracked content directory", async ({
      page,
      resetData,
      getContentGitLog,
    }) => {
      await resetData();
      await page.goto("/git");
      await fillSignInForm(page);

      await expect(
        page.getByText("Content directory is not tracked with Git."),
      ).toBeVisible();

      await page.getByText("Initialize").click();
      await expect(
        page.getByText("Content directory is not tracked with Git."),
      ).toHaveCount(0);
      await expect(page.getByText("Branches")).toBeVisible();

      await expect(page.getByText("Initial commit")).toBeVisible();

      const firstRecipeName = "Recipe A";
      const secondRecipeName = "Recipe B";

      const firstRecipeSlug = "recipe-a";
      const secondRecipeSlug = "recipe-b";

      const editedTestName = "edited";

      const mainBranchName = "main";
      const otherBranchName = "other-branch";

      async function makeTestRecipe(recipeName: string) {
        await page.goto("/new-recipe");
        await page.getByLabel("Name").fill(recipeName);
        await page.getByText("Submit").click();
        await expect(
          page.getByRole("heading", { level: 1, name: recipeName }),
        ).toBeVisible();
      }

      await makeTestRecipe(firstRecipeName);
      await makeTestRecipe(secondRecipeName);

      await page.getByText("Settings").click();
      await page.getByText("Git").click();
      await page.getByLabel("Branch Name").fill(otherBranchName);
      await page.getByText("Create").click();
      await expect(page.getByLabel("Branch Name")).toHaveValue("");

      await page.goto("/");
      await page.getByText(secondRecipeName).click();
      await page.getByRole("link", { name: "Edit", exact: true }).click();
      await page.getByLabel("Name").first().clear();
      await page.getByLabel("Name").first().fill(editedTestName);
      await page.getByText("Submit").click();
      await expect(
        page.getByRole("heading", { level: 1, name: editedTestName }),
      ).toBeVisible();

      await page.goto("/");
      await page.getByText(firstRecipeName).click();
      await page.getByText("Delete").click();

      await expect(page.getByText(editedTestName)).toBeVisible();
      expect(await getContentGitLog()).toEqual([
        `Delete recipe: ${firstRecipeSlug}`,
        `Update recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${firstRecipeSlug}`,
        "Initial commit",
      ]);
      await page.goto("/");
      await checkNamesInOrder(page, [editedTestName]);

      await page.getByText("Settings").click();
      await page.getByText("Git").click();
      await page.locator("label", { hasText: mainBranchName }).click();
      await page.getByText("Checkout").click();
      await expect(page.getByLabel("main")).toBeDisabled();

      await page.goto("/");
      await checkNamesInOrder(page, [secondRecipeName, firstRecipeName]);

      expect(await getContentGitLog()).toEqual([
        `Add new recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${firstRecipeSlug}`,
        "Initial commit",
      ]);

      await page.goto("/git");
      await page.getByText("other-branch").click();
      await page.getByText("Delete").click();

      await expect(
        page.getByText(/branch 'other-branch' is not fully merged/),
      ).toBeVisible();

      await page.getByText("other-branch").click();
      await page.getByText("Force Delete").click();

      await expect(page.getByText("other-branch")).toHaveCount(0);
    });

    test("should display an empty git log", async ({ page, resetData }) => {
      await resetData();
      await page.goto("/git");
      await fillSignInForm(page);

      await page.getByText("Initialize").click();

      await expect(page.getByText("Initial commit")).toBeVisible();
    });
  });

  test.describe("with some git history", () => {
    const firstRecipeSlug = "recipe-a";
    const secondRecipeSlug = "recipe-b";

    test.beforeEach(async ({ page, loadGitFixture }) => {
      await loadGitFixture("test-git.bundle");
      await page.goto("/git");
      await fillSignInForm(page);
    });

    test("should display the git log below the branches menu", async ({
      page,
    }) => {
      await page.goto("/git");
      await expect(page.getByText("Branches")).toBeVisible();
      await expect(page.getByText("Initial commit")).toBeVisible();
      await expect(
        page.getByText(`Add new recipe: ${firstRecipeSlug}`),
      ).toBeVisible();
      await expect(
        page.getByText(`Add new recipe: ${secondRecipeSlug}`),
      ).toBeVisible();
      await expect(
        page.getByText(`Update recipe: ${secondRecipeSlug}`),
      ).toBeVisible();
      await expect(
        page.getByText(`Delete recipe: ${firstRecipeSlug}`),
      ).toBeVisible();
    });

    test("should display the correct commit order in the git log", async ({
      page,
      getContentGitLog,
    }) => {
      await page.goto("/git");
      expect(await getContentGitLog()).toEqual([
        `Delete recipe: ${firstRecipeSlug}`,
        `Update recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${firstRecipeSlug}`,
        "Initial commit",
      ]);
    });

    test("should display commit details when clicking on a commit", async ({
      page,
    }) => {
      await page.goto("/git");
      await page.getByText(`Update recipe: ${secondRecipeSlug}`).click();

      await expect(page.getByText("Commit Details")).toBeVisible();
      await expect(
        page.getByText(`Update recipe: ${secondRecipeSlug}`),
      ).toBeVisible();
      await expect(page.getByText("Author")).toBeVisible();
      await expect(page.getByText("Date")).toBeVisible();
      await expect(page.getByText("Diff")).toBeVisible();

      await page.getByText("Close").click();
      await expect(page.getByText("Commit Details")).toHaveCount(0);
    });

    test("should display the correct commit details", async ({ page }) => {
      await page.goto("/git");
      await page.getByText(`Update recipe: ${secondRecipeSlug}`).click();

      await expect(page.getByText("Commit Details")).toBeVisible();
      await expect(
        page.getByText(`Update recipe: ${secondRecipeSlug}`),
      ).toBeVisible();
      await expect(page.getByText("Author")).toBeVisible();
      await expect(page.getByText("Date")).toBeVisible();
      await expect(page.getByText("Diff")).toBeVisible();

      await expect(page.getByText(/-.*Recipe B/)).toBeVisible();
      await expect(page.getByText(/\+.*edited/)).toBeVisible();
    });

    test("should display the correct commit details for a delete commit", async ({
      page,
    }) => {
      await page.goto("/git");
      await page.getByText(`Delete recipe: ${firstRecipeSlug}`).click();

      await expect(page.getByText("Commit Details")).toBeVisible();
      await expect(
        page.getByText(`Delete recipe: ${firstRecipeSlug}`),
      ).toBeVisible();
      await expect(page.getByText("Author")).toBeVisible();
      await expect(page.getByText("Date")).toBeVisible();
      await expect(page.getByText("Diff")).toBeVisible();

      await expect(page.getByText(/-.*Recipe A/)).toBeVisible();
    });

    test("should display the correct commit details for an add commit", async ({
      page,
    }) => {
      await page.goto("/git");
      await page.getByText(`Add new recipe: ${firstRecipeSlug}`).click();

      await expect(page.getByText("Commit Details")).toBeVisible();
      await expect(
        page.getByText(`Add new recipe: ${firstRecipeSlug}`),
      ).toBeVisible();
      await expect(page.getByText("Author")).toBeVisible();
      await expect(page.getByText("Date")).toBeVisible();
      await expect(page.getByText("Diff")).toBeVisible();

      await expect(page.getByText(/\+.*Recipe A/)).toBeVisible();
    });
  });
});
