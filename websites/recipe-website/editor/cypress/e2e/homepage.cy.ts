describe("Index Page", function () {
  describe("when empty", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/");
    });

    it("should not need authorization", function () {
      cy.findByText("Sign In");
    });

    it("should inform the user if there are no recipes", function () {
      cy.findByText("There are no recipes yet.");
    });

    it("should be able to create and delete a recipe", function () {
      const testRecipe = "Test Recipe";

      // We should start with no recipes
      cy.findByText("There are no recipes yet.");
      cy.findAllByText(testRecipe).should("not.exist");

      cy.findByText("New Recipe").click();

      cy.fillSignInForm();

      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Check home and ensure the recipe is present
      cy.visit("/");
      cy.findByText(testRecipe).click();

      // Delete the recipe and ensure it's gone
      cy.findByText("Delete").click();
      cy.findAllByText(testRecipe).should("not.exist");

      cy.request({
        url: "/recipe/test-page",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should be able to create recipes and see them in chronological order", function () {
      cy.findByText("Sign In").click();

      cy.fillSignInForm();

      const testNames = ["c", "a", "1"].map((x) => `Recipe ${x}`);
      for (const testRecipe of testNames) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(testRecipe);
        cy.findByText("Submit").click();
        cy.findByText(testRecipe, { selector: "h1" });
      }

      cy.visit("/");
      cy.checkNamesInOrder(testNames.reverse());
    });
  });

  describe("with just enough items for the front page", function () {
    beforeEach(function () {
      cy.resetData("front-page-only");
      cy.visit("/");
    });

    it("should not display a link to the index", function () {
      const allNames = [3, 2, 1].map((x) => `Recipe ${x}`);

      // Homepage should have latest three recipes
      cy.checkNamesInOrder(allNames);

      cy.findAllByText("More").should("not.exist");
    });
  });

  describe("with seven items", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/");
    });

    it("should display the latest six recipes", function () {
      const allNames = [7, 6, 5, 4, 3, 2, 1].map((x) => `Recipe ${x}`);

      // Homepage should have latest three recipes
      cy.checkNamesInOrder(allNames.slice(0, 6));

      // First page should have all recipes
      cy.findByText("More").click();
      cy.checkNamesInOrder(allNames.slice(0, 7));
    });
  });
});
