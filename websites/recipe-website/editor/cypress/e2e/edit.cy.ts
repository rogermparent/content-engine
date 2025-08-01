describe("Recipe Edit View", function () {
  describe("with seven items", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/recipe/recipe-6/edit");
    });

    it("should need authorization", function () {
      cy.findByText("Sign in with Credentials");
    });

    it("should require authorization even when recipe doesn't exist", function () {
      cy.visit({
        url: "/recipe/non-existent-recipe/edit",
      });
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should be able to add a video to an existing recipe", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Upload a video file
        cy.findByLabelText("Video").selectFile({
          contents: "cypress/fixtures/videos/sample-video.mp4",
          fileName: "sample-video.mp4",
          mimeType: "video/mp4",
        });

        // Verify that the video preview is displayed
        cy.get("video")
          .should("have.attr", "src")
          .should("match", /^blob:/);

        // Add instruction with VideoTime component
        cy.findByText("Paste Instructions").click();
        cy.findByTitle("Instructions Paste Area").type(
          `Do the first step like <VideoTime time={{}10{}}>10s</VideoTime>`,
        );

        cy.findByText("Import Instructions").click();

        cy.findByText("Submit").click();

        // Verify that the recipe view page displays the video
        cy.findByText("Recipe 6", { selector: "h1" });
        cy.get("video").should("exist");

        // TODO: Test VideoTime component's timestamp link
      });

      it("should be able to edit a recipe", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        cy.findByText("Advanced").click();

        const editedRecipeTitle = "Edited Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(editedRecipeTitle);

        const recipeDate = "2023-12-08T01:16:12.622";
        cy.findByLabelText("Date (UTC)").should("have.value", recipeDate);

        cy.findByText("Submit").click();

        cy.findByText(editedRecipeTitle, { selector: "h1" });

        cy.visit("/");
        cy.findByText(editedRecipeTitle);
        cy.checkNamesInOrder([
          "Recipe 7",
          editedRecipeTitle,
          "Recipe 5",
          "Recipe 4",
          "Recipe 3",
          "Recipe 2",
        ]);

        // Recipe date should not have changed
        cy.findByText(new Date(recipeDate + "Z").toLocaleString());
      });

      it("should be able to edit a recipe with prep and cook times", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        cy.findByText("Advanced").click();

        const editedRecipeTitle = "Edited Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(editedRecipeTitle);

        const recipeDate = "2023-12-08T01:16:12.622";
        cy.findByLabelText("Date (UTC)").should("have.value", recipeDate);

        // Verify that the prep, cook, and total times are not set
        cy.findByTitle("Prep Time Minutes").should("have.value", "");
        cy.findByTitle("Prep Time Hours").should("have.value", "");
        cy.findByTitle("Cook Time Minutes").should("have.value", "");
        cy.findByTitle("Cook Time Hours").should("have.value", "");
        cy.findByTitle("Total Time Minutes").should("have.value", "");
        cy.findByTitle("Total Time Hours").should("have.value", "");

        // Set prep and cook times
        cy.findByTitle("Prep Time Minutes").type("10");
        cy.findByTitle("Cook Time Minutes").type("20");
        cy.findByTitle("Cook Time Hours").type("1");
        cy.findByTitle("Total Time Hours").should(
          "have.attr",
          "placeholder",
          "1",
        );
        cy.findByTitle("Total Time Minutes").should(
          "have.attr",
          "placeholder",
          "30",
        );

        cy.findByText("Submit").click();

        cy.findByText(editedRecipeTitle, { selector: "h1" });

        // Verify that the prep, cook, and total times are displayed correctly
        cy.findByText("Prep Time").parent("div").findByText("10 min");
        cy.findByText("Cook Time").parent("div").findByText("1 hr 20 min");
        cy.findByText("Total Time").parent("div").findByText("1 hr 30 min");

        cy.visit("/");
        cy.findByText(editedRecipeTitle);
        cy.checkNamesInOrder([
          "Recipe 7",
          editedRecipeTitle,
          "Recipe 5",
          "Recipe 4",
          "Recipe 3",
          "Recipe 2",
        ]);

        // Recipe date should not have changed
        cy.findByText(new Date(recipeDate + "Z").toLocaleString());
      });

      it("should be able to edit a recipe with prep, cook, and total times", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        cy.findByText("Advanced").click();

        const editedRecipeTitle = "Edited Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(editedRecipeTitle);

        const recipeDate = "2023-12-08T01:16:12.622";
        cy.findByLabelText("Date (UTC)").should("have.value", recipeDate);

        // Verify that the prep, cook, and total times are not set
        cy.findByTitle("Prep Time Minutes").should("have.value", "");
        cy.findByTitle("Prep Time Hours").should("have.value", "");
        cy.findByTitle("Cook Time Minutes").should("have.value", "");
        cy.findByTitle("Cook Time Hours").should("have.value", "");
        cy.findByTitle("Total Time Minutes").should("have.value", "");
        cy.findByTitle("Total Time Hours").should("have.value", "");

        // Set prep, cook, and total times
        cy.findByTitle("Prep Time Minutes").type("10");
        cy.findByTitle("Cook Time Minutes").type("20");
        cy.findByTitle("Cook Time Hours").type("1");
        cy.findByTitle("Total Time Minutes").type("30");
        cy.findByTitle("Total Time Hours").type("3");

        cy.findByText("Submit").click();

        cy.findByText(editedRecipeTitle, { selector: "h1" });

        // Verify that the prep, cook, and total times are displayed correctly
        cy.findByText("Prep Time").parent("div").findByText("10 min");
        cy.findByText("Cook Time").parent("div").findByText("1 hr 20 min");
        cy.findByText("Total Time").parent("div").findByText("3 hr 30 min");

        cy.visit("/");
        cy.findByText(editedRecipeTitle);
        cy.checkNamesInOrder([
          "Recipe 7",
          editedRecipeTitle,
          "Recipe 5",
          "Recipe 4",
          "Recipe 3",
          "Recipe 2",
        ]);

        // Recipe date should not have changed
        cy.findByText(new Date(recipeDate + "Z").toLocaleString());
      });

      it("should be able to toggle an ingredient into a heading", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        cy.findByDisplayValue('<Multiplyable baseNumber="1 1/2" /> tsp salt')
          .parents("li")
          .findByText("Ingredient")
          .click();

        cy.findByText("Submit").click();

        cy.findByText("Recipe 6", { selector: "h1" });

        cy.findByText("1 1/2 tsp salt").parents("h3").should("exist");
      });

      it("should be able to set a recipe image over another image", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // Image preview should be current image
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/uploads/recipe/recipe-6/uploads/recipe-6-test-image.png/recipe-6-test-image-w3840q75.webp",
        );

        cy.findByLabelText("Image").selectFile({
          contents: "cypress/fixtures/images/recipe-6-test-image-alternate.png",
          fileName: "recipe-6-test-image-alternate.png",
          mimeType: "image/png",
        });

        // Image preview should now be blob from pending image
        cy.findByRole("img")
          .should("have.attr", "src")
          .should("match", /^blob:/);

        cy.findByText("Submit").click();

        // Image on view page should be alternate
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/uploads/recipe/recipe-6/uploads/recipe-6-test-image-alternate.png/recipe-6-test-image-alternate-w3840q75.webp",
        );

        // Image on index should be alternate
        cy.visit("/");
        cy.findByText("Recipe 6")
          .parentsUntil("li")
          .findByRole("img")
          .should(
            "have.attr",
            "src",
            "/image/uploads/recipe/recipe-6/uploads/recipe-6-test-image-alternate.png/recipe-6-test-image-alternate-w3840q75.webp",
          );
      });

      it("should be able to set a recipe image on a recipe without an image", function () {
        cy.visit("/recipe/recipe-5/edit");
        cy.findByText("Editing Recipe: Recipe 5");

        // With no image, the preview and "remove image" checkbox should not be present
        cy.findAllByRole("img").should("not.exist");
        cy.findAllByLabelText("Remove Image").should("not.exist");

        cy.findByLabelText("Image").selectFile({
          contents: "cypress/fixtures/images/recipe-6-test-image-alternate.png",
          fileName: "recipe-6-test-image-alternate.png",
          mimeType: "image/png",
        });

        // Image preview should now be blob from pending image
        cy.findByRole("img", { timeout: 10000 })
          .should("have.attr", "src")
          .should("match", /^blob:/);

        cy.findAllByLabelText("Remove Image").should("not.exist");

        cy.findByText("Submit").click();

        cy.findByText("Recipe 5", { selector: "h1" });
        // Image on view page should be alternate
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/uploads/recipe/recipe-5/uploads/recipe-6-test-image-alternate.png/recipe-6-test-image-alternate-w3840q75.webp",
        );

        // Image on index should be alternate
        cy.visit("/");
        cy.findByText("Recipe 5")
          .parentsUntil("li")
          .findByRole("img")
          .should(
            "have.attr",
            "src",
            "/image/uploads/recipe/recipe-5/uploads/recipe-6-test-image-alternate.png/recipe-6-test-image-alternate-w3840q75.webp",
          );
      });

      it("should be able to remove an image", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        cy.findByRole("img");

        cy.findByLabelText("Remove Image").click();

        cy.findByText("Submit").click();

        cy.findByText("Edit").click();

        // With no image, the preview and "remove image" checkbox should not be present
        cy.findAllByRole("img").should("not.exist");
        cy.findAllByLabelText("Remove Image").should("not.exist");
      });

      it("should be able to preserve an image when editing", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        cy.findByRole("img");

        const editedRecipeTitle = "Edited Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(editedRecipeTitle);

        cy.findByText("Submit").click();

        cy.findByText(editedRecipeTitle, { selector: "h1" });
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/uploads/recipe/recipe-6/uploads/recipe-6-test-image.png/recipe-6-test-image-w3840q75.webp",
        );

        cy.findByText("Edit").click();

        cy.findByText("Editing Recipe: Edited Recipe");

        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/uploads/recipe/recipe-6/uploads/recipe-6-test-image.png/recipe-6-test-image-w3840q75.webp",
        );
        cy.findByLabelText("Remove Image");
      });

      it("should have status 404 when recipe doesn't exist", function () {
        cy.request({
          url: "/recipe/non-existent-recipe/edit",
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 404);
      });

      it("should replace ingredients when pasting multiple times", function () {
        cy.findByText("Editing Recipe: Recipe 6");

        // First ingredient import
        cy.findByText("Paste Ingredients").click();
        cy.findByTitle("Ingredients Paste Area").type(
          `
* 1 cup water
* 2 tsp sugar
* 3 Tbsp oil
`,
        );

        cy.findByText("Import Ingredients").click();

        // Verify first batch of ingredients
        cy.get('[name="ingredients[0].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="1" /> cup water`,
        );
        cy.get('[name="ingredients[1].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="2" /> tsp sugar`,
        );
        cy.get('[name="ingredients[2].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="3" /> Tbsp oil`,
        );
        cy.get('[name="ingredients[3].ingredient"]').should("not.exist");

        // Second ingredient import
        cy.findByText("Paste Ingredients").click();
        cy.findByTitle("Ingredients Paste Area")
          .clear()
          .type(
            `
* 4 eggs
* 5 slices of bread
`,
          );

        cy.findByText("Import Ingredients").click();

        // Verify second batch of ingredients replaced the first batch
        cy.get('[name="ingredients[0].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="4" /> eggs`,
        );
        cy.get('[name="ingredients[1].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="5" /> slices of bread`,
        );
        cy.get('[name="ingredients[2].ingredient"]').should("not.exist");

        // Import empty ingredients
        cy.findByText("Paste Ingredients").click();
        cy.findByTitle("Ingredients Paste Area").clear();
        cy.findByText("Import Ingredients").click();

        // Verify all ingredients were removed
        cy.get('[name="ingredients[0].ingredient"]').should("not.exist");

        // Submit and verify the changes persist
        cy.findByText("Submit").click();
        cy.findByText("Recipe 6", { selector: "h1" });
        cy.findByText("1 cup water").should("not.exist");
      });
    });
  });
});
