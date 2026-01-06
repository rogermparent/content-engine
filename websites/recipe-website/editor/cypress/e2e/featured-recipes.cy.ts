describe("Featured Recipes", function () {
  describe("when empty", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/");
    });

    it("should not show featured recipes section when there are none", function () {
      cy.findByText("Latest Recipes");
      cy.findByText("Featured Recipes").should("not.exist");
    });

    it("should be able to create a featured recipe", function () {
      // First create a recipe to feature
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      const testRecipe = "Test Recipe for Feature";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Now create a featured recipe by clicking Feature button
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Should redirect to homepage
      cy.location("pathname").should("eq", "/");
      // Check that recipe appears in Featured Recipes section
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe);
        });
    });

    it("should show featured recipes on homepage", function () {
      // Create a recipe
      cy.findByText("New Recipe").click();
      cy.fillSignInForm();

      const testRecipe = "Featured Recipe Test";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Create a featured recipe by clicking Feature button
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Check homepage - scope to Featured Recipes section
      cy.visit("/");
      cy.findByText("Featured Recipes");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe);
        });
    });

    it("should show first 6 featured recipes on homepage", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create 7 recipes
      const recipeNames = [];
      for (let i = 1; i <= 7; i++) {
        cy.visit("/new-recipe");
        const recipeName = `Recipe ${i}`;
        recipeNames.push(recipeName);
        cy.findByLabelText("Name").type(recipeName);
        cy.findByText("Submit").click();
        cy.findByText(recipeName, { selector: "h1" });
      }

      // Create 7 featured recipes
      for (let i = 1; i <= 7; i++) {
        cy.visit(`/recipe/recipe-${i}`);
        cy.findByText("Feature").click();
        cy.findByText("Submit").click();
      }

      // Check homepage shows only first 6
      cy.visit("/");
      cy.findByText("Featured Recipes");
      // Should show recipes 7, 6, 5, 4, 3, 2 (most recent first)
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          for (let i = 7; i >= 2; i--) {
            cy.findByText(`Recipe ${i}`);
          }
          // Recipe 1 should not be visible on homepage (7th featured recipe)
          cy.findByText("Recipe 1").should("not.exist");
        });
    });

    it("should show all featured recipes on index page", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create 3 recipes
      for (let i = 1; i <= 3; i++) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(`Recipe ${i}`);
        cy.findByText("Submit").click();
        cy.findByText(`Recipe ${i}`, { selector: "h1" });
      }

      // Create 3 featured recipes
      for (let i = 1; i <= 3; i++) {
        cy.visit(`/recipe/recipe-${i}`);
        cy.findByText("Feature").click();
        cy.findByText("Submit").click();
        // Wait for redirect to homepage
        cy.location("pathname").should("eq", "/");
        // Check that recipe appears in Featured Recipes section
        cy.get("h2")
          .contains("Featured Recipes")
          .parent()
          .within(() => {
            cy.findByText(`Recipe ${i}`);
          });
      }

      // Check index page shows all
      cy.visit("/featured-recipes");
      cy.findByText("Featured Recipes");
      cy.findByText("Recipe 1");
      cy.findByText("Recipe 2");
      cy.findByText("Recipe 3");
    });

    it("should show note on index page but not homepage", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe with Note");
      cy.findByText("Submit").click();

      // Create a featured recipe with note
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("This is a featured recipe note");
      cy.findByText("Submit").click();

      // Homepage should not show note
      cy.visit("/");
      cy.findByText("Featured Recipes");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Recipe with Note");
          cy.findByText("This is a featured recipe note").should("not.exist");
        });

      // Index page should show note
      cy.visit("/featured-recipes");
      cy.findByText("This is a featured recipe note");
    });

    it("should be able to edit a featured recipe", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create recipes
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe A");
      cy.findByText("Submit").click();

      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe B");
      cy.findByText("Submit").click();

      // Create featured recipe by clicking Feature button on Recipe A
      cy.visit("/recipe/recipe-a");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Wait for redirect to homepage
      cy.location("pathname").should("eq", "/");

      // Check that Recipe A appears in Featured Recipes section
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Recipe A");
        });

      // Navigate to featured recipes index page using link
      cy.findByText("More Featured Recipes").click();

      // Ensure edited note isn't present already
      cy.findByText("This message is edited!").should("not.exist");

      // Navigate to featured recipe page using View Feature link
      cy.findByText("View Feature").click();
      // Click Edit button on featured recipe page
      cy.findByText("Edit").click();

      // Edit note on this feature
      cy.findByLabelText("Note").type("This message is edited!");
      cy.findByText("Submit").click();

      // Should redirect to homepage and show Recipe B in Featured Recipes section
      cy.location("pathname").should("eq", "/");

      // Should show new message feature index
      cy.findByText("More Featured Recipes").click();
      cy.findByText("This message is edited!").should("exist");
    });

    it("should be able to delete a featured recipe", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe to Delete");
      cy.findByText("Submit").click();

      // Create featured recipe by clicking Feature button
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Wait for redirect to homepage, then navigate to featured recipe to get slug
      cy.location("pathname").should("eq", "/");
      cy.visit("/featured-recipes");
      cy.findByText("Recipe to Delete").click();
      cy.findByText("Recipe to Delete", { selector: "h1" });

      // Delete the featured recipe
      cy.findByText("Delete").click();

      // Should redirect to featured recipes index
      cy.location("pathname").should("eq", "/");
      cy.findByText("Recipe to Delete").should("not.exist");

      cy.request({
        url: `/featured-recipe/recipe-to-delete`,
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should allow recipes to be featured multiple times", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Multi-Featured Recipe");
      cy.findByText("Submit").click();

      // Create first featured recipe
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("First feature");
      cy.findByText("Submit").click();

      // Create second featured recipe for same recipe
      cy.visit("/recipe/multi-featured-recipe");
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("Second feature");
      cy.findByText("Submit").click();

      // Check index page shows both
      cy.visit("/featured-recipes");
      cy.findAllByText("Multi-Featured Recipe").should("have.length", 2);
      cy.findByText("First feature");
      cy.findByText("Second feature");
    });

    it("should sort featured recipes by feature date", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create recipes
      for (let i = 1; i <= 3; i++) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(`Recipe ${i}`);
        cy.findByText("Submit").click();
      }

      // Create featured recipes with delays to ensure different dates
      cy.visit("/recipe/recipe-1");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();
      cy.wait(1000);

      cy.visit("/recipe/recipe-2");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();
      cy.wait(1000);

      cy.visit("/recipe/recipe-3");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Check index page - should show Recipe 3 first (most recent)
      cy.visit("/featured-recipes");
      // Most recent should be first
      cy.findAllByText(/Recipe \d/)
        .first()
        .should("contain", "Recipe 3");
    });

    it("should have a Feature button on recipe pages", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      const testRecipe = "Recipe to Feature";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Should see Feature button
      cy.findByText("Feature");
      cy.findByText("Edit");
      cy.findByText("Copy");
      cy.findByText("Delete");
    });

    it("should navigate to featured recipe form with recipe pre-selected when clicking Feature button", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      const testRecipe = "Pre-selected Recipe";
      const testRecipeSlug = "pre-selected-recipe";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Click Feature button
      cy.findByText("Feature").click();

      // Should be on featured recipe creation page
      cy.location("pathname").should("eq", "/featured-recipe/new");
      cy.location("search").should("include", `recipe=${testRecipeSlug}`);

      // Recipe should be pre-filled (hidden field)
      // Can submit to create featured recipe
      cy.findByText("Submit").click();

      // Should redirect to homepage
      cy.location("pathname").should("eq", "/");
      cy.findByText("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe).should("exist");
        });
    });

    it("should pre-fill recipe when coming from Feature button", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      const testRecipe = "Recipe A";

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Navigate to Recipe A and click Feature button
      cy.visit("/recipe/recipe-a");
      cy.findByText(testRecipe, { selector: "h1" });
      cy.findByText("Feature").click();

      // Recipe A should be pre-filled (hidden field)
      // Form should be ready to submit
      cy.findByText("Submit").click();

      // Should redirect to homepage
      cy.location("pathname").should("eq", "/");
      cy.findByText("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe).should("exist");
        });
    });

    it("should allow adding a note when featuring from Feature button", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      const testRecipe = "Recipe with Feature Note";
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Click Feature button
      cy.findByText("Feature").click();

      // Recipe should be pre-filled (hidden field)
      // Add a note
      cy.findByLabelText("Note").type(
        "This recipe was featured from the Feature button",
      );
      cy.findByText("Submit").click();

      // Should redirect to homepage, then navigate to featured recipe to see note
      cy.location("pathname").should("eq", "/");
      cy.visit("/featured-recipes");
      cy.findByText("This recipe was featured from the Feature button");
    });

    it("should be able to change a featured recipe slug", function () {
      const testRecipe = "Recipe for Slug Change";

      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type(testRecipe);
      cy.findByText("Submit").click();
      cy.findByText(testRecipe, { selector: "h1" });

      // Create featured recipe by clicking Feature button
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Wait for redirect to homepage, then navigate to featured recipes to get slug
      cy.location("pathname").should("eq", "/");
      cy.visit("/featured-recipes");
      cy.findAllByText("View Feature").first().click();
      cy.findByText(testRecipe, { selector: "h1" });

      const originalSlug = "recipe-for-slug-change";

      // Edit the featured recipe
      cy.findByText("Edit").click();

      // Expand Advanced section and change slug
      cy.findByText("Advanced").click();
      // Wait for details to expand and slug input to be visible and interactable
      cy.findByLabelText("Slug").should("be.visible");
      // Use force to clear if element is covered (details animation)
      cy.findByLabelText("Slug").clear({ force: true });
      const newSlug = "custom-featured-slug";
      cy.findByLabelText("Slug").type(newSlug, { force: true });
      cy.findByText("Submit").click();

      // Should redirect to new slug URL
      cy.location("pathname").should("eq", `/`);
      cy.findByText("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText(testRecipe).click();
        });

      cy.visit("/featured-recipes");
      cy.findAllByText("View Feature").first().click();
      cy.location("pathname").should("eq", `/featured-recipe/${newSlug}`);

      // Old slug should not work
      cy.request({
        url: `/featured-recipe/${originalSlug}`,
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);

      // New slug should work
      cy.visit(`/featured-recipe/${newSlug}`);
      cy.findByText(testRecipe, { selector: "h1" });
    });

    it("should show View Feature link on featured recipes index page", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe with View Feature Link");
      cy.findByText("Submit").click();
      cy.findByText("Recipe with View Feature Link", { selector: "h1" });

      // Create featured recipe by clicking Feature button
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Wait for redirect to homepage, then navigate to featured recipe to get slug
      cy.location("pathname").should("eq", "/");
      cy.visit("/featured-recipes");
      cy.findByText("Recipe with View Feature Link").click();
      cy.findByText("Recipe with View Feature Link", { selector: "h1" });

      // Since slugs are determined based on current time in the server, avoid testing them directly for now

      // const slug = "recipe-with-view-feature-link";

      // Visit featured recipes index page
      cy.visit("/featured-recipes");
      cy.findByText("Featured Recipes");

      // Should see View Feature link
      cy.findByText("View Feature");
      // cy.findByText("View Feature").should(
      //   "have.attr",
      //   "href",
      //   `/featured-recipe/${slug}`,
      // );

      // Clicking View Feature should navigate to featured recipe page
      cy.findByText("View Feature").click();
      // cy.location("pathname").should("eq", `/featured-recipe/${slug}`);
      cy.findByText("Recipe with View Feature Link", { selector: "h1" });
    });

    it("should not show View Feature link on homepage", function () {
      cy.visit("/new-recipe");
      cy.fillSignInForm();

      // Create a recipe
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Recipe Without View Feature Link");
      cy.findByText("Submit").click();
      cy.findByText("Recipe Without View Feature Link", { selector: "h1" });

      // Create featured recipe by clicking Feature button
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Wait for redirect to homepage
      cy.location("pathname").should("eq", "/");

      // Visit homepage
      cy.visit("/");
      cy.findByText("Featured Recipes");

      // Should see the featured recipe
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Recipe Without View Feature Link");
        });

      // Should NOT see View Feature link on homepage
      cy.findByText("View Feature").should("not.exist");
    });
  });

  describe("pagination", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/new-recipe");
      cy.fillSignInForm();
    });

    it("should show pagination on index page when more than 12 featured recipes", function () {
      // Create 15 recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(`Recipe ${i}`);
        cy.findByText("Submit").click();
        cy.findByText(`Recipe ${i}`, { selector: "h1" });
      }

      // Create 15 featured recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit(`/recipe/recipe-${i}`);
        cy.findByText("Feature").click();
        cy.findByText("Submit").click();
      }

      // Visit featured recipes index
      cy.visit("/featured-recipes");
      cy.findByText("Featured Recipes");

      // Should show first 12 recipes (most recent first: 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4)
      // Recipe 3, 2, 1 should not be visible on first page
      cy.findByText("Recipe 15");
      cy.findByText("Recipe 4");
      cy.findByText("Recipe 3").should("not.exist");

      // Should show pagination with page number 1
      cy.get("span").contains("1");

      // Should show next arrow (→)
      cy.findByText("→");
    });

    it("should navigate to page 2", function () {
      // Create 15 recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(`Recipe ${i}`);
        cy.findByText("Submit").click();
        cy.findByText(`Recipe ${i}`, { selector: "h1" });
      }

      // Create 15 featured recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit(`/recipe/recipe-${i}`);
        cy.findByText("Feature").click();
        cy.findByText("Submit").click();
      }

      // Visit featured recipes index and go to page 2
      cy.visit("/featured-recipes");
      cy.findByText("→").click();

      // Should be on page 2
      cy.location("pathname").should("eq", "/featured-recipes/2");

      // Should show remaining 3 recipes (3, 2, 1)
      cy.findByText("Recipe 3");
      cy.findByText("Recipe 2");
      cy.findByText("Recipe 1");

      // Should show page number 2
      cy.get("span").contains("2");

      // Should not show next arrow (no more pages)
      cy.findByText("→").should("not.exist");
    });

    it("should navigate back from page 2 to unnumbered first page", function () {
      // Create 15 recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit("/new-recipe");
        cy.findByLabelText("Name").type(`Recipe ${i}`);
        cy.findByText("Submit").click();
        cy.findByText(`Recipe ${i}`, { selector: "h1" });
      }

      // Create 15 featured recipes
      for (let i = 1; i <= 15; i++) {
        cy.visit(`/recipe/recipe-${i}`);
        cy.findByText("Feature").click();
        cy.findByText("Submit").click();
      }

      // Visit page 2
      cy.visit("/featured-recipes/2");
      cy.get("span").contains("2");

      // Click back arrow
      cy.findByText("←").click();

      // Should go to unnumbered first page (not /featured-recipes/1)
      cy.location("pathname").should("eq", "/featured-recipes");
      cy.get("span").contains("1");
    });

    it("should redirect /featured-recipes/1 to /featured-recipes", function () {
      // Create a recipe and feature it
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Test Recipe");
      cy.findByText("Submit").click();
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Visit /featured-recipes/1
      cy.visit("/featured-recipes/1");

      // Should redirect to /featured-recipes
      cy.location("pathname").should("eq", "/featured-recipes");
    });

    it("should show Home link on first page instead of back arrow", function () {
      // Create a recipe and feature it
      cy.visit("/new-recipe");
      cy.findByLabelText("Name").type("Test Recipe");
      cy.findByText("Submit").click();
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Visit featured recipes index
      cy.visit("/featured-recipes");

      // Should show Home link
      cy.findByText("Home");

      // Should not show back arrow
      cy.findByText("←").should("not.exist");
    });
  });
});
