describe("Single Recipe View", function () {
  describe("with seven items", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/recipe/recipe-6");
    });

    it("should display a recipe", function () {
      cy.findByText("Recipe 6", { selector: "h1" });
      cy.get("title").should("contain.text", "Recipe 6");
    });

    it("should not need authorization", function () {
      cy.findByText("Sign In");
    });

    it("should be able to multiply ingredient amounts", function () {
      cy.findByText("1 1/2 tsp salt");
      cy.findByText("Sprinkle 1/2 tsp salt in water");
      cy.findByLabelText("Multiply").type("2");
      cy.findByText("3 tsp salt");
      cy.findByText("Sprinkle 1 tsp salt in water");
    });

    it.only("should be able to edit a recipe", function () {
      cy.findByText("Edit").click();

      cy.fillSignInForm();

      cy.findByText("Editing Recipe: Recipe 6", { timeout: 10000 });

      cy.findByText("Advanced").click();

      const editedRecipe = "Edited Recipe";

      cy.findAllByLabelText("Name").first().clear();
      cy.findAllByLabelText("Name").first().type(editedRecipe);

      const recipeDate = "2023-12-08T01:16:12.622";
      cy.findByLabelText("Date (UTC)").should("have.value", recipeDate);

      cy.findByText("Submit").click();

      cy.findByText(editedRecipe, { selector: "h1" });

      cy.visit("/");
      cy.findByText(editedRecipe);
      cy.checkNamesInOrder([
        "Recipe 7",
        editedRecipe,
        "Recipe 5",
        "Recipe 4",
        "Recipe 3",
        "Recipe 2",
      ]);

      // Recipe date should not have changed
      cy.findByText(new Date(recipeDate + "Z").toLocaleString());
    });

    it("should be able to delete the recipe", function () {
      cy.findByText("Sign In").click();

      // First click of the delete button should trigger a sign-in
      cy.fillSignInForm();

      cy.findByText("Delete").click();

      cy.findByText("Recipe 4");
      cy.checkNamesInOrder([
        "Recipe 7",
        "Recipe 5",
        "Recipe 4",
        "Recipe 3",
        "Recipe 2",
        "Recipe 1",
      ]);
      cy.request({
        url: "/recipe/recipe-6",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });

  it("should have status 404 when recipe doesn't exist", function () {
    cy.request({
      url: "/recipe/non-existent-recipe",
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 404);
  });
});
