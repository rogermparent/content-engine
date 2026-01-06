/**
 * Fixture Generation Spec
 *
 * This spec generates the test fixtures used by other tests.
 * It should be run explicitly using the `generate-fixtures` script
 * and is NOT included in the normal test suite.
 *
 * Run with: pnpm generate-fixtures
 */

describe("Fixture Generation", function () {
  describe("one-recipe fixture", function () {
    it("generates one-recipe fixture", function () {
      cy.resetData();
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create "Existing Recipe"
      cy.findByLabelText("Name").type("Existing Recipe");
      cy.findByLabelText("Slug").type("existing-recipe");
      cy.findByText("Submit").click();

      // Verify the recipe was created
      cy.findByText("Existing Recipe", { selector: "h1" });

      // Copy to fixtures
      cy.copyFixtures("one-recipe");
    });
  });

  describe("three-recipes fixture", function () {
    it("generates three-recipes fixture", function () {
      cy.resetData();
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create "First Recipe" (oldest)
      cy.findByLabelText("Name").type("First Recipe");
      cy.findByLabelText("Description").type("This is the first recipe.");
      cy.findByLabelText("Slug").type("first-recipe");
      cy.findByText("Submit").click();
      cy.findByText("First Recipe", { selector: "h1" });

      // Create "Second Recipe" (middle)
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Second Recipe");
      cy.findByLabelText("Description").type("This is the second recipe.");
      cy.findByLabelText("Slug").type("second-recipe");
      cy.findByText("Submit").click();
      cy.findByText("Second Recipe", { selector: "h1" });

      // Create "Third Recipe" (newest)
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Third Recipe");
      cy.findByLabelText("Description").type("This is the third recipe.");
      cy.findByLabelText("Slug").type("third-recipe");
      cy.findByText("Submit").click();
      cy.findByText("Third Recipe", { selector: "h1" });

      // Verify all recipes are on the recipes page
      cy.visit("/recipes");
      cy.findByText("First Recipe");
      cy.findByText("Second Recipe");
      cy.findByText("Third Recipe");

      // Copy to fixtures
      cy.copyFixtures("three-recipes");
    });
  });

  describe("one-featured-recipe fixture", function () {
    it("generates one-featured-recipe fixture", function () {
      cy.resetData();
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe to feature
      cy.findByLabelText("Name").type("Featured Recipe");
      cy.findByLabelText("Slug").type("featured-recipe");
      cy.findByText("Submit").click();
      cy.findByText("Featured Recipe", { selector: "h1" });

      // Feature the recipe
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("This recipe is featured for testing.");
      cy.findByText("Submit").click();

      // Verify redirect to homepage
      cy.location("pathname").should("eq", "/");

      // Verify featured recipe appears
      cy.findByText("Featured Recipes");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Featured Recipe");
        });

      // Copy to fixtures
      cy.copyFixtures("one-featured-recipe");
    });
  });

  describe("many-featured-recipes fixture", function () {
    it("generates many-featured-recipes fixture for pagination testing", function () {
      cy.resetData();
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create 15 recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(`Recipe ${i}`);
        cy.findByLabelText("Slug").clear().type(`recipe-${i}`);
        cy.findByText("Submit").click();
        cy.findByText(`Recipe ${i}`, { selector: "h1" });
      }

      // Feature all 15 recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit(`/recipe/recipe-${i}`);
        cy.findByText("Feature").click();
        cy.findByText("Submit").click();
        cy.location("pathname").should("eq", "/");
      }

      // Verify pagination is available on featured recipes index
      cy.visit("/featured-recipes");
      cy.findByText("Featured Recipes");
      cy.findByText("→"); // Next arrow should be visible

      // Copy to fixtures
      cy.copyFixtures("many-featured-recipes");
    });
  });
});
