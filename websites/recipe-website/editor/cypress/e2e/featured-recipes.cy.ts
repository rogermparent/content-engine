describe("Featured Recipes", function () {
  describe("homepage display", function () {
    it("should not show featured recipes section when there are none", function () {
      cy.resetData();
      cy.visit("/");
      cy.findByText("Latest Recipes");
      cy.findByText("Featured Recipes").should("not.exist");
    });

    it("should show featured recipes on homepage", function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/");

      cy.findByText("Featured Recipes");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Featured Recipe");
        });
    });

    it("should show first 6 featured recipes on homepage", function () {
      // Load fixture with 15 featured recipes
      cy.resetData("many-featured-recipes");
      cy.visit("/");

      cy.findByText("Featured Recipes");
      // Should show recipes 15, 14, 13, 12, 11, 10 (most recent first, only 6)
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          for (let i = 15; i >= 10; i--) {
            cy.findByText(`Recipe ${i}`);
          }
          // Recipe 9 should not be visible on homepage (7th featured recipe)
          cy.findByText("Recipe 9").should("not.exist");
        });
    });

    it("should not show View Feature link on homepage", function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/");

      cy.findByText("Featured Recipes");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Featured Recipe");
        });

      // Should NOT see View Feature link on homepage
      cy.findByText("View Feature").should("not.exist");
    });

    it("should not show note on homepage", function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/");

      cy.findByText("Featured Recipes");
      cy.get("h2")
        .contains("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Featured Recipe");
          cy.findByText("This recipe is featured for testing.").should(
            "not.exist",
          );
        });
    });
  });

  describe("index page", function () {
    it("should show all featured recipes on index page", function () {
      cy.resetData("many-featured-recipes");
      cy.visit("/featured-recipes");

      cy.findByText("Featured Recipes");
      // Should show first page of recipes (12 per page)
      cy.findByText("Recipe 15");
      cy.findByText("Recipe 4");
    });

    it("should show note on index page", function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/featured-recipes");

      cy.findByText("This recipe is featured for testing.");
    });

    it("should show View Feature link on featured recipes index page", function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/featured-recipes");

      cy.findByText("Featured Recipes");

      // Should see View Feature link
      cy.findByText("View Feature");

      // Clicking View Feature should navigate to featured recipe page
      cy.findByText("View Feature").click();
      cy.findByText("Featured Recipe", { selector: "h1" });
    });
  });

  describe("creation", function () {
    beforeEach(function () {
      cy.resetData("one-recipe");
      cy.visit("/recipe/existing-recipe");
      cy.signIn();
    });

    it("should allow recipes to be featured multiple times", function () {
      // Create first featured recipe
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("First feature");
      cy.findByText("Submit").click();

      // Create second featured recipe for same recipe
      cy.visit("/recipe/existing-recipe");
      cy.findByText("Feature").click();
      cy.findByLabelText("Note").type("Second feature");
      cy.findByText("Submit").click();

      // Check index page shows both
      cy.visit("/featured-recipes");
      cy.findAllByText("Existing Recipe").should("have.length", 2);
      cy.findByText("First feature");
      cy.findByText("Second feature");
    });

    it("should sort featured recipes by feature date", function () {
      cy.resetData("three-recipes");

      // Create featured recipes with delays to ensure different dates
      cy.visit("/recipe/third-recipe");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      cy.visit("/recipe/first-recipe");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      cy.visit("/recipe/second-recipe");
      cy.findByText("Feature").click();
      cy.findByText("Submit").click();

      // Most recent should be first
      cy.findByText("Featured Recipes")
        .parent()
        .findAllByRole("listitem")
        .then((featuredItems) => {
          cy.wrap(featuredItems[0]).findByText("Second Recipe");
          cy.wrap(featuredItems[1]).findByText("First Recipe");
          cy.wrap(featuredItems[2]).findByText("Third Recipe");
        });
    });
  });

  describe("deletion", function () {
    beforeEach(function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/featured-recipes");
      cy.findByText("View Feature").click();
      cy.findByText("Featured Recipe", { selector: "h1" });
      cy.signIn();
    });

    it("should be able to delete a featured recipe", function () {
      cy.findByText("Featured Recipe", { selector: "h1" });

      // Store the slug from the current URL for later verification
      cy.location("pathname").as("featuredRecipeUrl");

      // Delete the featured recipe
      cy.findByText("Delete").click();

      // Should redirect to homepage which now does not show featured section
      cy.location("pathname").should("eq", "/");
      cy.findByText("Featured Recipes").should("not.exist");

      cy.get<string>("@featuredRecipeUrl").then((url) => {
        cy.request({
          url,
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 404);
      });
    });
  });

  describe("Feature button", function () {
    beforeEach(function () {
      cy.resetData("one-recipe");
      cy.visit("/recipe/existing-recipe");
      cy.signIn();
    });

    it("should have a Feature button on recipe pages", function () {
      cy.findByText("Existing Recipe", { selector: "h1" });

      // Should see Feature button
      cy.findByText("Feature");
      cy.findByText("Edit");
      cy.findByText("Copy");
      cy.findByText("Delete");
    });

    it("should navigate to featured recipe form with recipe pre-selected when clicking Feature button", function () {
      cy.findByText("Existing Recipe", { selector: "h1" });

      // Click Feature button
      cy.findByText("Feature").click();

      // Should be on featured recipe creation page
      cy.location("pathname").should("eq", "/featured-recipe/new");
      cy.location("search").should("include", "recipe=existing-recipe");

      // Recipe should be pre-filled (hidden field)
      // Can submit to create featured recipe
      cy.findByText("Submit").click();

      // Should redirect to homepage
      cy.location("pathname").should("eq", "/");
      cy.findByText("Featured Recipes")
        .parent()
        .within(() => {
          cy.findByText("Existing Recipe").should("exist");
        });
    });

    it("should allow adding a note when featuring from Feature button", function () {
      cy.findByText("Existing Recipe", { selector: "h1" });

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
  });

  describe("new page", function () {
    beforeEach(function () {
      cy.resetData("one-recipe");
      cy.visit("/featured-recipe/new?recipe=existing-recipe");
    });

    it("should require authentication", function () {
      cy.findByText("Sign in with Credentials");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should be able to create a featured recipe", function () {
        cy.findByText("Submit").click();

        // Should redirect to homepage
        cy.location("pathname").should("eq", "/");
        // Check that recipe appears in Featured Recipes section
        cy.get("h2")
          .contains("Featured Recipes")
          .parent()
          .within(() => {
            cy.findByText("Existing Recipe");
          });
      });

      it("should allow adding a note when creating a featured recipe", function () {
        cy.findByLabelText("Note").type("This is a test note for the feature");
        cy.findByText("Submit").click();

        // Should redirect to homepage, then navigate to featured recipe to see note
        cy.location("pathname").should("eq", "/");
        cy.visit("/featured-recipes");
        cy.findByText("This is a test note for the feature");
      });
    });
  });

  describe("edit page", function () {
    beforeEach(function () {
      cy.resetData("one-featured-recipe");
      cy.visit("/featured-recipes");
      cy.findByText("View Feature").click();
      cy.findByText("Edit").click();
    });

    it("should require authentication", function () {
      cy.findByText("Sign in with Credentials");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should be able to edit a featured recipe note", function () {
        cy.findByLabelText("Note").clear();
        cy.findByLabelText("Note").type("This message is edited!");
        cy.findByText("Submit").click();

        // Should redirect to homepage
        cy.location("pathname").should("eq", "/");

        // Should show new message on feature index
        cy.visit("/featured-recipes");
        cy.findByText("This message is edited!");
      });

      it("should be able to change a featured recipe slug", function () {
        // Store the slug from the current URL for later verification
        cy.location("pathname").as("featuredRecipeUrl");

        // Expand Advanced section and change slug
        cy.findByText("Advanced").click();
        cy.findByLabelText("Slug").should("be.visible");
        cy.findByLabelText("Slug").clear({ force: true });
        const newSlug = "custom-featured-slug";
        cy.findByLabelText("Slug").type(newSlug, { force: true });
        cy.findByText("Submit").click();

        // Should redirect to homepage
        cy.location("pathname").should("eq", "/");

        // Navigate to featured recipes index and verify new slug
        cy.visit("/featured-recipes");
        cy.findByText("View Feature").click();
        cy.location("pathname").should("eq", `/featured-recipe/${newSlug}`);

        // Old slug should not work
        cy.get<string>("@featuredRecipeUrl").then((url) => {
          cy.request({
            url,
            failOnStatusCode: false,
          })
            .its("status")
            .should("equal", 404);
        });
      });
    });
  });

  describe("pagination", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/");
    });

    it("should show pagination on index page when more than 12 featured recipes", function () {
      // Load fixture with 15 featured recipes
      cy.resetData("many-featured-recipes");

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
      // Load fixture with 15 featured recipes
      cy.resetData("many-featured-recipes");

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
      // Load fixture with 15 featured recipes
      cy.resetData("many-featured-recipes");

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
      // Load fixture with one featured recipe
      cy.resetData("one-featured-recipe");

      // Visit /featured-recipes/1
      cy.visit("/featured-recipes/1");

      // Should redirect to /featured-recipes
      cy.location("pathname").should("eq", "/featured-recipes");
    });

    it("should show Home link on first page instead of back arrow", function () {
      // Load fixture with one featured recipe
      cy.resetData("one-featured-recipe");

      // Visit featured recipes index
      cy.visit("/featured-recipes");

      // Should show Home link
      cy.findByText("Home");

      // Should not show back arrow
      cy.findByText("←").should("not.exist");
    });
  });
});
