describe("Ingredient Auto-Preview", function () {
  describe("with two-pages fixture", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/recipe/recipe-6/edit");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should show ingredient input and preview side-by-side", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Verify input field is visible
        cy.findByLabelText("Ingredient 1").should("be.visible");

        // Verify that the preview element exists
        cy.findByLabelText("Ingredient 1 Preview").should("exist");
      });

      it("should auto-update preview when typing in ingredient field", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Click, clear the input and type a new value
        cy.findByLabelText("Ingredient 1").click();
        cy.findByLabelText("Ingredient 1").clear();
        cy.findByLabelText("Ingredient 1").type(
          '<Multiplyable baseNumber="2" /> cups sugar',
        );

        // Verify the preview updates automatically
        cy.findByLabelText("Ingredient 1 Preview").should(
          "have.text",
          "2 cups sugar",
        );
      });

      it("should render markdown in the preview", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Click, clear and type markdown with bold text
        cy.findByLabelText("Ingredient 1").click();
        cy.findByLabelText("Ingredient 1").clear();
        cy.findByLabelText("Ingredient 1").type(
          '<Multiplyable baseNumber="1" /> cup **strong** coffee',
        );

        // Verify markdown is rendered (bold tag should exist)
        cy.findByLabelText("Ingredient 1 Preview")
          .find("strong")
          .should("contain", "strong");
        cy.findByLabelText("Ingredient 1 Preview").should(
          "have.text",
          "1 cup strong coffee",
        );
      });

      it("should handle empty ingredient input gracefully", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Click and clear the input
        cy.findByLabelText("Ingredient 1").click();
        cy.findByLabelText("Ingredient 1").clear();

        // Verify preview exists but is empty
        cy.findByLabelText("Ingredient 1 Preview").should("exist");
        cy.findByLabelText("Ingredient 1 Preview").should("have.text", "");
      });

      it("should show preview for newly added ingredients", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Click to add a new ingredient
        cy.findByText("Add Ingredient").click();

        // Find and click the newly added ingredient input
        cy.findByLabelText("Ingredient 3").should("exist").click();

        // Type in the new ingredient field
        cy.findByLabelText("Ingredient 3").type(
          '<Multiplyable baseNumber="3" /> eggs',
        );

        // Verify preview updates for the new ingredient
        cy.findByLabelText("Ingredient 3 Preview").should(
          "have.text",
          "3 eggs",
        );
      });

      it("should maintain preview when toggling between ingredient and heading", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Verify initial state shows preview
        cy.findByLabelText("Ingredient 1 Preview").should("exist");

        // Toggle to heading
        cy.findByLabelText("Toggle Ingredient 1 Type").click();

        // Preview should still exist after toggle
        cy.findByLabelText("Ingredient 1 Preview").should("exist");

        // Toggle back to ingredient
        cy.findByLabelText("Toggle Ingredient 1 Type").click();

        // Preview should still exist
        cy.findByLabelText("Ingredient 1 Preview").should("exist");
      });

      it("should render Multiplyable component in preview", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // The preview should render the Multiplyable component
        // (The actual rendering depends on the DummyMultiplyable component)
        cy.findByLabelText("Ingredient 1 Preview").should(
          "have.text",
          "1 1/2 tsp salt",
        );
      });

      it("should persist preview state after form submission", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Click and modify an ingredient
        cy.findByLabelText("Ingredient 1").click();
        cy.findByLabelText("Ingredient 1").clear();
        cy.findByLabelText("Ingredient 1").type(
          '<Multiplyable baseNumber="2" /> tsp pepper',
        );

        // Submit the form
        cy.findByText("Submit").click();

        // Verify we're on the view page
        cy.findByText("Recipe 6", { selector: "h1" });

        // The ingredient should be updated in the recipe view
        cy.findByText("2 tsp pepper").should("exist");

        // Go back to edit
        cy.findByText("Edit").click();

        // Verify the ingredient still has preview
        cy.findByLabelText("Ingredient 1 Preview").should(
          "have.text",
          "2 tsp pepper",
        );
      });
    });
  });

  describe("ingredient import with preview", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/recipe/recipe-6/edit");
      cy.fillSignInForm();
    });

    it("should show preview for imported ingredients", function () {
      cy.findByText("Editing Recipe: Recipe 6");

      // Import ingredients
      cy.findByText("Paste Ingredients").click();
      cy.findByTitle("Ingredients Paste Area").click();
      cy.findByTitle("Ingredients Paste Area").type(
        `
* 1 cup water
* 2 tsp **sugar**
* 3 Tbsp oil
`,
      );

      cy.findByText("Import Ingredients").click();

      // Verify each imported ingredient has a preview
      cy.findByLabelText("Ingredient 1").should(
        "have.value",
        '<Multiplyable baseNumber="1" /> cup water',
      );
      cy.findByLabelText("Ingredient 1 Preview").should(
        "have.text",
        "1 cup water",
      );

      cy.findByLabelText("Ingredient 2").should(
        "have.value",
        '<Multiplyable baseNumber="2" /> tsp \*\*sugar\*\*',
      );
      cy.findByLabelText("Ingredient 2 Preview")
        .find("strong")
        .should("contain", "sugar");
      cy.findByLabelText("Ingredient 2 Preview").should(
        "have.text",
        "2 tsp sugar",
      );

      cy.findByLabelText("Ingredient 3").should(
        "have.value",
        '<Multiplyable baseNumber="3" /> Tbsp oil',
      );
      cy.findByLabelText("Ingredient 3 Preview").should(
        "have.text",
        "3 Tbsp oil",
      );
    });
  });
});
