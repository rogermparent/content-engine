describe("Page Editor", function () {
  describe("with a clean slate", function () {
    it("should need authorization", function () {
      cy.resetData();
      cy.visit("/pages");
      cy.findByText("Sign in with Credentials");
    });

    it("should need authorization when directly going to an edit page", function () {
      cy.resetData("about-page");
      cy.visit("/pages/edit/about");
      cy.findByText("Sign in with Credentials");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.resetData();
        cy.visit("/pages");
        cy.fillSignInForm();
      });

      it("should be able to add, edit, and remove a page", function () {
        // Confirm initial empty state
        cy.findByText("There are no pages yet.");

        cy.request({
          url: "/my-new-page",
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 404);

        // Add new page
        cy.findByText("New Page").click();

        cy.findByText("Back to Pages");

        cy.findByLabelText("Name").type("My New Page");
        cy.findByLabelText("Content").type(
          "## Page Subtitle\n\nThis is a new page, *formatted* in **markdown**!",
        );

        cy.findByText("Submit").click();

        // Confirm redirected to new page with given content

        cy.findByText(/^This is a new page/);
        cy.findByText("formatted");
        cy.findByText("markdown");

        cy.request({
          url: "/my-new-page",
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 200);

        // Edit the page
        cy.findByText("Edit").click();

        cy.findByLabelText("Name").clear();
        cy.findByLabelText("Name").type("My New Edited Page");
        cy.findByLabelText("Content").clear();
        cy.findByLabelText("Content").type(
          "## Page Subtitle\n\nThis is an edited page, *formatted* in **markdown**!\n\n- It has a list!\n\n- with two items!",
        );

        cy.findByText("Submit").click();

        // Verify page is edited

        cy.findByText(/^This is an edited page/);
        cy.findByText("formatted");
        cy.findByText("markdown");
        cy.findByText("It has a list!");
        cy.findByText("with two items!");

        // Delete page
        cy.findByText("Delete").click();

        // Confirm page is deleted
        cy.findByText("There are no pages yet.");

        cy.request({
          url: "/my-new-page",
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 404);
      });
    });
  });
});
