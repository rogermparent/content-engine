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

      it.only("should be able to add a video to an existing recipe", function () {
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

        // Test VideoTime component's timestamp link
        cy.findByText("10s").click();
        cy.get("video").then(($video) => {
          expect($video[0].currentTime).to.be.closeTo(10, 1); // Adjust the time as per your test video
        });
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
            "/image/uploads/recipe/recipe-6/uploads/recipe-6-test-image-alternate.png/recipe-6-test-image-alternate-w828q75.webp",
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
            "/image/uploads/recipe/recipe-5/uploads/recipe-6-test-image-alternate.png/recipe-6-test-image-alternate-w828q75.webp",
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
    });
  });
});
