describe("Git content", function () {
  describe("when empty", function () {
    it("should display an empty git log", function () {
      cy.resetData();
      cy.initializeContentGit();
      cy.visit("/");

      cy.findByText("Settings").click();
      cy.fillSignInForm();
      cy.findByText("Git").click();

      cy.findByText("No commits yet").should("exist");
    });
  });

  describe("when not empty", function () {
    const firstRecipeName = "Recipe A";
    const secondRecipeName = "Recipe B";

    const firstRecipeSlug = "recipe-a";
    const secondRecipeSlug = "recipe-b";

    const editedTestName = "edited";

    const mainBranchName = "main";
    const otherBranchName = "other-branch";

    function makeTestRecipe(recipeName: string) {
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type(recipeName);
      cy.findByText("Submit").click();
      cy.findByText(recipeName, { selector: "h1" });
    }

    beforeEach(function () {
      cy.resetData();
      cy.initializeContentGit();
      cy.visit("/");

      cy.findByText("Sign In").click();
      cy.fillSignInForm();

      // Make two recipes to build some test history
      makeTestRecipe(firstRecipeName);
      makeTestRecipe(secondRecipeName);

      // Copy (checkout -b) the branch to preserve current state
      cy.findByText("Settings").click();
      cy.findByText("Git").click();
      cy.findByLabelText("Branch Name").type(otherBranchName);
      cy.findByText("Create").click();
      cy.findByLabelText("Branch Name").should("have.value", "");

      // Edit second recipe
      cy.visit("/");
      cy.findByText(secondRecipeName).click();
      cy.findByText("Edit").click();
      cy.findAllByLabelText("Name").first().clear();
      cy.findAllByLabelText("Name").first().type(editedTestName);
      cy.findByText("Submit").click();
      cy.findByText(editedTestName, { selector: "h1" });

      // Delete first recipe
      cy.visit("/");
      cy.findByText(firstRecipeName).click();
      cy.findByText("Delete").click();

      // Verify edit and delete have happened
      cy.findByText(editedTestName);
      cy.getContentGitLog().should("have.ordered.members", [
        `Delete recipe: ${firstRecipeSlug}`,
        `Update recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${firstRecipeSlug}`,
        "Initial Commit",
      ]);
    });

    it("should display the git log below the branches menu", function () {
      cy.visit("/git");
      cy.findByText("Branches").should("exist");
      cy.findByText("Initial Commit").should("exist");
      cy.findByText(`Add new recipe: ${firstRecipeSlug}`).should("exist");
      cy.findByText(`Add new recipe: ${secondRecipeSlug}`).should("exist");
      cy.findByText(`Update recipe: ${secondRecipeSlug}`).should("exist");
      cy.findByText(`Delete recipe: ${firstRecipeSlug}`).should("exist");
    });

    it("should display the correct commit order in the git log", function () {
      cy.visit("/git");
      cy.getContentGitLog().should("have.ordered.members", [
        `Delete recipe: ${firstRecipeSlug}`,
        `Update recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${firstRecipeSlug}`,
        "Initial Commit",
      ]);
    });

    it("should display commit details when clicking on a commit", function () {
      cy.visit("/git");
      cy.findByText(`Update recipe: ${secondRecipeSlug}`).click();

      cy.findByText("Commit Details").should("exist");
      cy.findByText(`Update recipe: ${secondRecipeSlug}`).should("exist");
      cy.findByText("Author").should("exist");
      cy.findByText("Date").should("exist");
      cy.findByText("Diff").should("exist");

      cy.findByText("Close").click();
      cy.findByText("Commit Details").should("not.exist");
    });

    it("should display the correct commit details", function () {
      cy.visit("/git");
      cy.findByText(`Update recipe: ${secondRecipeSlug}`).click();

      cy.findByText("Commit Details").should("exist");
      cy.findByText(`Update recipe: ${secondRecipeSlug}`).should("exist");
      cy.findByText("Author").should("exist");
      cy.findByText("Date").should("exist");
      cy.findByText("Diff").should("exist");

      cy.findByText("- Name: Recipe B").should("exist");
      cy.findByText("+ Name: edited").should("exist");
    });

    it("should display the correct commit details for a delete commit", function () {
      cy.visit("/git");
      cy.findByText(`Delete recipe: ${firstRecipeSlug}`).click();

      cy.findByText("Commit Details").should("exist");
      cy.findByText(`Delete recipe: ${firstRecipeSlug}`).should("exist");
      cy.findByText("Author").should("exist");
      cy.findByText("Date").should("exist");
      cy.findByText("Diff").should("exist");

      cy.findByText(`- Recipe A`).should("exist");
    });

    it("should display the correct commit details for an add commit", function () {
      cy.visit("/git");
      cy.findByText(`Add new recipe: ${firstRecipeSlug}`).click();

      cy.findByText("Commit Details").should("exist");
      cy.findByText(`Add new recipe: ${firstRecipeSlug}`).should("exist");
      cy.findByText("Author").should("exist");
      cy.findByText("Date").should("exist");
      cy.findByText("Diff").should("exist");

      cy.findByText(`+ Recipe A`).should("exist");
    });
  });
});
