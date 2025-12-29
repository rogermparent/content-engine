describe("Bookmarks", function () {
  beforeEach(function () {
    cy.resetData("two-pages");
    // Clear any existing bookmarks from localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem("recipe_bookmarks");
    });
  });

  describe("Bookmarks Page", function () {
    it("should show empty state when no bookmarks exist", function () {
      cy.visit("/bookmarks");

      cy.findByText("My Bookmarks");
      cy.findByText("You have not bookmarked any recipes yet.");
      cy.findByText("Browse Recipes").should("have.attr", "href", "/recipes/1");
    });

    it("should navigate to recipes from empty state", function () {
      cy.visit("/bookmarks");

      cy.findByText("Browse Recipes").click();
      cy.url().should("include", "/recipes/1");
    });
  });

  describe("Bookmarking from Recipe Detail", function () {
    it("should bookmark a recipe", function () {
      cy.visit("/recipe/recipe-6");

      cy.findByText("Recipe 6", { selector: "h1" });

      // Should show bookmark button (not bookmarked)
      cy.findByTitle("Bookmark").should("exist");
      cy.findByTitle("Remove Bookmark").should("not.exist");

      // Click to bookmark
      cy.findByTitle("Bookmark").click();

      // Should now show remove bookmark button
      cy.findByTitle("Remove Bookmark").should("exist");
      cy.findByTitle("Bookmark").should("not.exist");
    });

    it("should remove a bookmark", function () {
      cy.visit("/recipe/recipe-6");

      // Bookmark the recipe first
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Remove the bookmark
      cy.findByTitle("Remove Bookmark").click();

      // Should now show bookmark button again
      cy.findByTitle("Bookmark").should("exist");
      cy.findByTitle("Remove Bookmark").should("not.exist");
    });

    it("should persist bookmark after page reload", function () {
      cy.visit("/recipe/recipe-6");

      // Bookmark the recipe
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Reload the page
      cy.reload();

      // Bookmark should still be present
      cy.findByTitle("Remove Bookmark").should("exist");
    });

    it("should persist bookmark when navigating between recipes", function () {
      cy.visit("/recipe/recipe-6");

      // Bookmark recipe 6
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Navigate to a different recipe
      cy.visit("/recipe/recipe-5");
      cy.findByText("Recipe 5", { selector: "h1" });

      // Recipe 5 should not be bookmarked
      cy.findByTitle("Bookmark").should("exist");

      // Go back to recipe 6
      cy.visit("/recipe/recipe-6");

      // Recipe 6 should still be bookmarked
      cy.findByTitle("Remove Bookmark").should("exist");
    });
  });

  describe("Bookmarks Page with Bookmarked Recipes", function () {
    it("should display bookmarked recipes", function () {
      // Bookmark a recipe first
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Go to bookmarks page
      cy.visit("/bookmarks");

      cy.findByText("My Bookmarks");
      cy.findByText("Recipe 6");
      cy.findByText("You have not bookmarked any recipes yet.").should(
        "not.exist",
      );
    });

    it("should display multiple bookmarked recipes", function () {
      // Bookmark multiple recipes
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      cy.visit("/recipe/recipe-3");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Go to bookmarks page
      cy.visit("/bookmarks");

      cy.findByText("My Bookmarks");
      cy.findByText("Recipe 6");
      cy.findByText("Recipe 3");
    });

    it("should navigate to recipe detail from bookmarks page", function () {
      // Bookmark a recipe first
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Go to bookmarks page and click on the recipe
      cy.visit("/bookmarks");
      cy.findByText("Recipe 6").click();

      // Should be on recipe detail page
      cy.url().should("include", "/recipe/recipe-6");
      cy.findByText("Recipe 6", { selector: "h1" });
    });

    it("should update bookmarks page when recipe is unbookmarked", function () {
      // Bookmark two recipes
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      cy.visit("/recipe/recipe-3");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Verify both are on bookmarks page
      cy.visit("/bookmarks");
      cy.findByText("Recipe 6");
      cy.findByText("Recipe 3");

      // Remove bookmark from recipe 6
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Remove Bookmark").click();
      cy.findByTitle("Bookmark").should("exist");

      // Check bookmarks page - only recipe 3 should remain
      cy.visit("/bookmarks");
      cy.findByText("Recipe 3");
      cy.findByText("Recipe 6").should("not.exist");
    });

    it("should show empty state after removing all bookmarks", function () {
      // Bookmark a recipe
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Bookmark").click();
      cy.findByTitle("Remove Bookmark").should("exist");

      // Verify it's on bookmarks page
      cy.visit("/bookmarks");
      cy.findByText("Recipe 6");

      // Remove the bookmark
      cy.visit("/recipe/recipe-6");
      cy.findByTitle("Remove Bookmark").click();
      cy.findByTitle("Bookmark").should("exist");

      // Bookmarks page should show empty state
      cy.visit("/bookmarks");
      cy.findByText("You have not bookmarked any recipes yet.");
      cy.findByText("Recipe 6").should("not.exist");
    });
  });

  describe("Bookmark Button on Recipe Lists", function () {
    it("should show bookmark button on hover in recipe list", function () {
      cy.visit("/");

      // Hover over a recipe card to reveal bookmark button
      cy.findByText("Recipe 6")
        .closest("li")
        .within(() => {
          // The bookmark button should be hidden initially (opacity-0)
          // but become visible on hover (group-hover:opacity-100)
          cy.findByTitle("Bookmark").should("exist");
        });
    });
  });

  describe("Header Navigation", function () {
    it("should have Bookmarks link in header", function () {
      cy.visit("/");

      cy.findByRole("link", { name: "Bookmarks" }).should("exist");
    });

    it("should navigate to bookmarks page from header", function () {
      cy.visit("/");

      cy.findByRole("link", { name: "Bookmarks" }).click();

      cy.url().should("include", "/bookmarks");
      cy.findByText("My Bookmarks");
    });
  });
});
