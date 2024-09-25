describe("Git content", function () {
  describe("when empty", function () {
    describe.only("new tests", function () {
      it("should initialize a Git repository", function () {
        cy.resetData();
        cy.visit("/git");
        cy.fillSignInForm();

        cy.findByText("Content directory is not tracked with Git").should(
          "exist",
        );

        cy.findByText("Initialize").click();
        cy.findByText("Content directory is not tracked with Git").should(
          "not.exist",
        );
        cy.findByText("Branches").should("exist");
      });

      it("should create a new branch", function () {
        cy.resetData();
        cy.initializeContentGit();
        cy.visit("/");
        cy.fillSignInForm();

        const newBranchName = "test-branch";

        cy.findByText("Settings").click();
        cy.findByText("Git").click();
        cy.findByLabelText("Branch Name").type(newBranchName);
        cy.findByText("Create").click();

        cy.findByText(newBranchName).should("exist");
      });
      it("should checkout a branch", function () {
        cy.resetData();
        cy.initializeContentGit();
        cy.visit("/");
        cy.fillSignInForm();

        const mainBranchName = "main";
        const newBranchName = "test-branch";

        cy.findByText("Settings").click();
        cy.findByText("Git").click();
        cy.findByText(newBranchName).click();
        cy.findByText("Checkout").click();

        cy.findByText(newBranchName).should("have.class", "font-bold");
        cy.findByText(mainBranchName).should("not.have.class", "font-bold");
      });
      it("should delete a branch", function () {
        cy.resetData();
        cy.initializeContentGit();
        cy.visit("/");
        cy.fillSignInForm();

        const newBranchName = "test-branch";

        cy.findByText("Settings").click();
        cy.findByText("Git").click();
        cy.findByText(newBranchName).click();
        cy.findByText("Delete").click();

        cy.findByText(`The branch '${newBranchName}' has been deleted.`).should(
          "exist",
        );
        cy.findByText(newBranchName).should("not.exist");
      });
      it("should force delete a branch", function () {
        cy.resetData();
        cy.initializeContentGit();
        cy.visit("/");
        cy.fillSignInForm();

        const newBranchName = "test-branch";

        cy.findByText("Settings").click();
        cy.findByText("Git").click();
        cy.findByLabelText("Branch Name").type(newBranchName);
        cy.findByText("Create").click();

        cy.findByText(newBranchName).click();
        cy.findByText("Force Delete").click();

        cy.findByText(`The branch '${newBranchName}' has been deleted.`).should(
          "exist",
        );
        cy.findByText(newBranchName).should("not.exist");
      });
      it("should display error messages for invalid branch names", function () {
        cy.resetData();
        cy.initializeContentGit();
        cy.visit("/");
        cy.fillSignInForm();

        cy.findByText("Settings").click();
        cy.findByText("Git").click();
        cy.findByText("Create").click();

        cy.findByText("Branch Name is required").should("exist");
      });
    });

    it("should indicate when the content directory is not tracked by git", function () {
      cy.resetData();
      cy.visit("/git");
      cy.fillSignInForm();

      cy.findByText("Content directory is not tracked with Git");
      cy.findAllByText("Branches").should("not.exist");
    });

    it("should be able to work with a git-tracked content directory", function () {
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

      cy.visit("/git");
      // Test delete: try to normal delete branch which should fail because unmerged
      cy.findByText("other-branch").click();
      cy.findByText("Delete").click();

      cy.findByText(/the branch 'other-branch' is not fully merged/);

      // Test force delete: delete should succeed and branch should be removed
      cy.findByText("other-branch").click();
      cy.findByText("Force Delete").click();

      cy.findAllByText("other-branch").should("not.exist");
    });
  });
});
