describe("Paste Field Replace Feature", function () {
  describe("with the one-recipe fixture", function () {
    beforeEach(function () {
      cy.resetData("one-recipe");
      cy.visit("/new-recipe");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      describe("Ingredients", function () {
        it("should replace text in pasted ingredients (case-insensitive)", function () {
          cy.findByText("Paste Ingredients").click();

          cy.findByText("Paste Ingredients")
            .parent("details")
            .within(() => {
              cy.findByTitle("Ingredients Paste Area").type(
                `1 Cup flour
2 cups sugar
3 CUP water`,
              );

              cy.findByTitle("Find text").type("cup");
              cy.findByTitle("Replace with").type("tablespoon");
              cy.findByText("Replace All").click();

              // Verify textarea content was replaced
              cy.findByTitle("Ingredients Paste Area").should(
                "have.value",
                `1 tablespoon flour
2 tablespoons sugar
3 tablespoon water`,
              );

              cy.findByText("Import Ingredients").click();
            });

          // Verify the ingredients were imported with the replaced text
          cy.get('[name="ingredients[0].ingredient"]').should(
            "contain.value",
            "tablespoon flour",
          );
          cy.get('[name="ingredients[1].ingredient"]').should(
            "contain.value",
            "tablespoons sugar",
          );
          cy.get('[name="ingredients[2].ingredient"]').should(
            "contain.value",
            "tablespoon water",
          );
        });

        it("should replace all occurrences on a single line", function () {
          cy.findByText("Paste Ingredients").click();

          cy.findByText("Paste Ingredients")
            .parent("details")
            .within(() => {
              cy.findByTitle("Ingredients Paste Area").type(
                `1 cup flour and 1 cup water`,
              );

              cy.findByTitle("Find text").type("cup");
              cy.findByTitle("Replace with").type("tbsp");
              cy.findByText("Replace All").click();

              cy.findByTitle("Ingredients Paste Area").should(
                "have.value",
                `1 tbsp flour and 1 tbsp water`,
              );
            });
        });

        it("should do nothing when find field is empty", function () {
          cy.findByText("Paste Ingredients").click();

          cy.findByText("Paste Ingredients")
            .parent("details")
            .within(() => {
              cy.findByTitle("Ingredients Paste Area").type(`1 cup flour`);

              // Leave find field empty
              cy.findByTitle("Replace with").type("tablespoon");
              cy.findByText("Replace All").click();

              // Content should remain unchanged
              cy.findByTitle("Ingredients Paste Area").should(
                "have.value",
                `1 cup flour`,
              );
            });
        });

        it("should replace with empty string (delete matches)", function () {
          cy.findByText("Paste Ingredients").click();

          cy.findByText("Paste Ingredients")
            .parent("details")
            .within(() => {
              cy.findByTitle("Ingredients Paste Area").type(
                `1 cup (about 120g) flour`,
              );

              cy.findByTitle("Find text").type("(about 120g) ");
              // Leave replace field empty
              cy.findByText("Replace All").click();

              cy.findByTitle("Ingredients Paste Area").should(
                "have.value",
                `1 cup flour`,
              );
            });
        });

        it("should handle special regex characters in find text", function () {
          cy.findByText("Paste Ingredients").click();

          cy.findByText("Paste Ingredients")
            .parent("details")
            .within(() => {
              cy.findByTitle("Ingredients Paste Area").type(
                `flour (1 cup)
sugar (2 cups)`,
              );

              cy.findByTitle("Find text").type("(");
              cy.findByTitle("Replace with").type("[");
              cy.findByText("Replace All").click();

              cy.findByTitle("Ingredients Paste Area").should(
                "have.value",
                `flour [1 cup)
sugar [2 cups)`,
              );
            });
        });
      });

      describe("Instructions", function () {
        it("should replace text in pasted instructions (case-insensitive)", function () {
          cy.findByText("Paste Instructions").click();

          cy.findByText("Paste Instructions")
            .parent("details")
            .within(() => {
              cy.findByTitle("Instructions Paste Area").type(
                `1. Mix the flour
2. Add FLOUR to the bowl
3. Stir Flour until smooth`,
              );

              cy.findByTitle("Find text").type("flour");
              cy.findByTitle("Replace with").type("sugar");
              cy.findByText("Replace All").click();

              cy.findByTitle("Instructions Paste Area").should(
                "have.value",
                `1. Mix the sugar
2. Add sugar to the bowl
3. Stir sugar until smooth`,
              );

              cy.findByText("Import Instructions").click();
            });

          cy.get('[name="instructions[0].text"]').should(
            "have.value",
            "Mix the sugar",
          );
          cy.get('[name="instructions[1].text"]').should(
            "have.value",
            "Add sugar to the bowl",
          );
          cy.get('[name="instructions[2].text"]').should(
            "have.value",
            "Stir sugar until smooth",
          );
        });

        it("should replace all occurrences in instructions", function () {
          cy.findByText("Paste Instructions").click();

          cy.findByText("Paste Instructions")
            .parent("details")
            .within(() => {
              cy.findByTitle("Instructions Paste Area").type(
                `Mix and mix and mix again`,
              );

              cy.findByTitle("Find text").type("mix");
              cy.findByTitle("Replace with").type("stir");
              cy.findByText("Replace All").click();

              cy.findByTitle("Instructions Paste Area").should(
                "have.value",
                `stir and stir and stir again`,
              );
            });
        });
      });
    });
  });
});
