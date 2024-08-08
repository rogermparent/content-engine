describe("Project Edit View", function () {
  describe("with seven items", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/project/project-6/edit");
    });

    it("should need authorization", function () {
      cy.findByText("Sign in with Credentials");
    });

    it("should require authorization even when project doesn't exist", function () {
      cy.visit({
        url: "/project/non-existent-project/edit",
      });
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should be able to edit a project", function () {
        cy.findByText("Editing Project: Project 6");

        cy.findByText("Advanced").click();

        const editedProjectTitle = "Edited Project";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(editedProjectTitle);

        const projectDate = "2023-12-08T01:16:12.622";
        cy.findByLabelText("Date (UTC)").should("have.value", projectDate);

        cy.findByText("Submit").click();

        cy.findByText(editedProjectTitle);

        cy.visit("/");
        cy.findByText(editedProjectTitle);
        cy.checkNamesInOrder([
          "Project 7",
          editedProjectTitle,
          "Project 5",
          "Project 4",
          "Project 3",
          "Project 2",
        ]);

        // Project date should not have changed
        cy.findByText(new Date(projectDate + "Z").toLocaleString());
      });

      it("should be able to set a project image over another image", function () {
        cy.findByText("Editing Project: Project 6");

        // Image preview should be current image
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/project/project-6/uploads/project-6-test-image.png/project-6-test-image-w3840q75.webp",
        );

        cy.findByLabelText("Image").selectFile({
          contents:
            "cypress/fixtures/images/project-6-test-image-alternate.png",
          fileName: "project-6-test-image-alternate.png",
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
          "/image/project/project-6/uploads/project-6-test-image-alternate.png/project-6-test-image-alternate-w3840q75.webp",
        );

        // Image on index should be alternate
        cy.visit("/");
        cy.findByText("Project 6")
          .parentsUntil("li")
          .findByRole("img")
          .should(
            "have.attr",
            "src",
            "/image/project/project-6/uploads/project-6-test-image-alternate.png/project-6-test-image-alternate-w828q75.webp",
          );
      });

      it("should be able to set a project image on a project without an image", function () {
        cy.visit("/project/project-5/edit");
        cy.findByText("Editing Project: Project 5");

        // With no image, the preview and "remove image" checkbox should not be present
        cy.findAllByRole("img").should("not.exist");
        cy.findAllByLabelText("Remove Image").should("not.exist");

        cy.findByLabelText("Image").selectFile({
          contents:
            "cypress/fixtures/images/project-6-test-image-alternate.png",
          fileName: "project-6-test-image-alternate.png",
          mimeType: "image/png",
        });

        // Image preview should now be blob from pending image
        cy.findByRole("img", { timeout: 10000 })
          .should("have.attr", "src")
          .should("match", /^blob:/);

        cy.findAllByLabelText("Remove Image").should("not.exist");

        cy.findByText("Submit").click();

        cy.findByText("Project 5");
        // Image on view page should be alternate
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/project/project-5/uploads/project-6-test-image-alternate.png/project-6-test-image-alternate-w3840q75.webp",
        );

        // Image on index should be alternate
        cy.visit("/");
        cy.findByText("Project 5")
          .parentsUntil("li")
          .findByRole("img")
          .should(
            "have.attr",
            "src",
            "/image/project/project-5/uploads/project-6-test-image-alternate.png/project-6-test-image-alternate-w828q75.webp",
          );
      });

      it("should be able to remove an image", function () {
        cy.findByText("Editing Project: Project 6");

        cy.findByRole("img");

        cy.findByLabelText("Remove Image").click();

        cy.findByText("Submit").click();

        cy.findByText("Edit").click();

        // With no image, the preview and "remove image" checkbox should not be present
        cy.findAllByRole("img").should("not.exist");
        cy.findAllByLabelText("Remove Image").should("not.exist");
      });

      it("should be able to preserve an image when editing", function () {
        cy.findByText("Editing Project: Project 6");

        cy.findByRole("img");

        const editedProjectTitle = "Edited Project";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(editedProjectTitle);

        cy.findByText("Submit").click();

        cy.findByText(editedProjectTitle);
        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/project/project-6/uploads/project-6-test-image.png/project-6-test-image-w3840q75.webp",
        );

        cy.findByText("Edit").click();

        cy.findByText("Editing Project: Edited Project");

        cy.findByRole("img").should(
          "have.attr",
          "src",
          "/image/project/project-6/uploads/project-6-test-image.png/project-6-test-image-w3840q75.webp",
        );
        cy.findByLabelText("Remove Image");
      });

      it("should have status 404 when project doesn't exist", function () {
        cy.request({
          url: "/project/non-existent-project/edit",
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 404);
      });
    });
  });
});
