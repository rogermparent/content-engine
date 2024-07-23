describe("Git content", () => {
  describe("when empty", () => {
    it("should indicate when the content directory is not tracked by git", () => {
      cy.resetData();
      cy.visit("/git");
      cy.fillSignInForm();

      cy.findByText("Content directory is not tracked with Git");
      cy.findAllByText("Branches").should("not.exist");
    });

    it("should be able to work with a git-tracked content directory", () => {
      cy.resetData();
      cy.initializeContentGit();
      cy.visit("/");

      // Verify we're at the initial commit state
      cy.getContentGitLog().should("have.ordered.members", ["Initial Commit"]);

      cy.findByText("Sign In").click();
      cy.fillSignInForm();

      const firstRecipeName = "Recipe A";
      const secondRecipeName = "Recipe B";

      const firstRecipeSlug = "recipe-a";
      const secondRecipeSlug = "recipe-b";

      const editedTestName = "edited";
      //const editedTestSlug = "edited";

      const mainBranchName = "main";
      const otherBranchName = "other-branch";

      function makeTestRecipe(recipeName: string) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(recipeName);
        cy.findByText("Submit").click();
        cy.findByText(recipeName, { selector: "h1" });
      }

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
      cy.visit("/");
      cy.checkNamesInOrder([editedTestName]);

      // Checkout main
      cy.findByText("Settings").click();
      cy.findByText("Git").click();
      cy.findByText(mainBranchName, { selector: "label" }).click();
      cy.findByText("Checkout").click();
      cy.findByLabelText("main").should("be.disabled");

      // Verify we're in the state we were in when the branch was copied
      cy.visit("/");
      cy.checkNamesInOrder([secondRecipeName, firstRecipeName]);

      cy.getContentGitLog().should("have.ordered.members", [
        `Add new recipe: ${secondRecipeSlug}`,
        `Add new recipe: ${firstRecipeSlug}`,
        "Initial Commit",
      ]);
    });
  });
});
