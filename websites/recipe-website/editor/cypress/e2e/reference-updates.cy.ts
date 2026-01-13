describe("Reference Updates", function () {
  beforeEach(function () {
    cy.resetData();
    cy.visit("/");
  });

  describe("when recipe slug changes", function () {
    it("should update featured recipe reference when recipe slug changes", function () {
      // Create a recipe
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      const testRecipe = "Original Recipe Name";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Create a featured recipe for it
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Should redirect to homepage
      cy.location("pathname").should("eq", "/");

      // Verify featured recipe shows the recipe
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe);
        });

      // Edit the recipe and change its slug
      cy.visit("/recipe/original-recipe-name");
      cy.findByText("Edit").click();
      cy.findByText("Advanced").click();
      cy.findByLabelText("Slug").should("be.visible");
      cy.findByLabelText("Slug").clear({ force: true });
      cy.findByLabelText("Slug").type("renamed-recipe-slug", { force: true });
      cy.findByText("Submit").click();

      // Verify recipe is accessible at new URL
      cy.location("pathname").should("eq", "/recipe/renamed-recipe-slug");
      cy.findByText(testRecipe, { selector: "h1" });

      // Verify featured recipe still shows the recipe (reference was updated)
      cy.visit("/");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe);
        });

      // Click through to verify the link works
      cy.findByText("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe).click();
        });
      cy.location("pathname").should("eq", "/recipe/renamed-recipe-slug");
    });

    it("should update multiple featured recipes when recipe slug changes", function () {
      // Create a recipe
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      const testRecipe = "Multi-Featured Recipe";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Create first featured recipe
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("First feature");
      cy.findByText("Submit").click();
      cy.location("pathname").should("eq", "/");

      // Create second featured recipe
      cy.visit("/recipe/multi-featured-recipe");
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("Second feature");
      cy.findByText("Submit").click();
      cy.location("pathname").should("eq", "/");

      // Change the recipe slug
      cy.visit("/recipe/multi-featured-recipe");
      cy.findByText("Edit").click();
      cy.findByText("Advanced").click();
      cy.findByLabelText("Slug").should("be.visible");
      cy.findByLabelText("Slug").clear({ force: true });
      cy.findByLabelText("Slug").type("new-multi-featured", { force: true });
      cy.findByText("Submit").click();

      // Verify recipe is accessible at new URL
      cy.location("pathname").should("eq", "/recipe/new-multi-featured");

      // Verify both featured recipes still work
      cy.visit("/featured-recipes");
      cy.findAllByText(testRecipe).should("have.length", 2);
      cy.findByText("First feature");
      cy.findByText("Second feature");

      // Click through to verify links work
      cy.findAllByText(testRecipe).first().click();
      cy.location("pathname").should("eq", "/recipe/new-multi-featured");
    });

    it("should not affect featured recipes for other recipes", function () {
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      // Create Recipe A
      cy.findByLabelText("Name").type("Recipe A");
      cy.findByText("Submit").click();
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();
      cy.location("pathname").should("eq", "/");

      // Create Recipe B
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe B");
      cy.findByText("Submit").click();
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();
      cy.location("pathname").should("eq", "/");

      // Change Recipe A's slug
      cy.visit("/recipe/recipe-a");
      cy.findByText("Edit").click();
      cy.findByText("Advanced").click();
      cy.findByLabelText("Slug").should("be.visible");
      cy.findByLabelText("Slug").clear({ force: true });
      cy.findByLabelText("Slug").type("recipe-a-renamed", { force: true });
      cy.findByText("Submit").click();

      // Verify Recipe A is accessible at new URL
      cy.location("pathname").should("eq", "/recipe/recipe-a-renamed");

      // Verify both featured recipes still work correctly
      cy.visit("/featured-recipes");
      cy.findByText("Recipe A");
      cy.findByText("Recipe B");

      // Recipe A feature should link to new slug
      cy.findByText("Recipe A").click();
      cy.location("pathname").should("eq", "/recipe/recipe-a-renamed");

      // Recipe B feature should still link to original slug
      cy.visit("/featured-recipes");
      cy.findByText("Recipe B").click();
      cy.location("pathname").should("eq", "/recipe/recipe-b");
    });

    it("should handle recipe slug change when no featured recipes exist", function () {
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      cy.findByLabelText("Name").type("Lonely Recipe");
      cy.findByText("Submit").click();
      cy.findByText("Lonely Recipe", { selector: "h1" });

      // Change slug without featuring
      cy.findByText("Edit").click();
      cy.findByText("Advanced").click();
      cy.findByLabelText("Slug").should("be.visible");
      cy.findByLabelText("Slug").clear({ force: true });
      cy.findByLabelText("Slug").type("still-lonely", { force: true });
      cy.findByText("Submit").click();

      // Should work fine
      cy.location("pathname").should("eq", "/recipe/still-lonely");
      cy.findByText("Lonely Recipe", { selector: "h1" });
    });

    it("should preserve featured recipe note after reference update", function () {
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      const testRecipe = "Recipe with Note";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Create featured recipe with note
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type(
        "This is an important note about the feature",
      );
      cy.findByText("Submit").click();
      cy.location("pathname").should("eq", "/");

      // Change the recipe slug
      cy.visit("/recipe/recipe-with-note");
      cy.findByText("Edit").click();
      cy.findByText("Advanced").click();
      cy.findByLabelText("Slug").should("be.visible");
      cy.findByLabelText("Slug").clear({ force: true });
      cy.findByLabelText("Slug").type("renamed-with-note", { force: true });
      cy.findByText("Submit").click();

      // Verify recipe is accessible at new URL
      cy.location("pathname").should("eq", "/recipe/renamed-with-note");

      // Verify featured recipe still has the note
      cy.visit("/featured-recipes");
      cy.findByText(testRecipe);
      cy.findByText("This is an important note about the feature");

      // Click through to verify link works
      cy.findByText(testRecipe).click();
      cy.location("pathname").should("eq", "/recipe/renamed-with-note");
    });
  });
});
