describe("Menu Editor", function () {
  describe("with a clean slate", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/menus");
    });

    it("should need authorization", function () {
      cy.findByText("Sign in with Credentials");
    });

    it("should need authorization when directly going to edit the header", function () {
      cy.visit("/menus/edit/header");
      cy.findByText("Sign in with Credentials");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should be able to add to, edit, and clear the header nav", function () {
        // Add nav item to header

        cy.findByText("Header").click();
        cy.findByText("Append").click();
        cy.findByLabelText("Name").type("About", { force: true });
        cy.findByLabelText("Href").type("/about", { force: true });
        cy.findByText("Submit").click();

        // Verify new header nav

        cy.findByText("Menu Editor");
        cy.findByText("About").should("have.attr", "href", "/about");

        // Edit header nav

        cy.findByText("Header").click();

        cy.findByLabelText("Name").clear();
        cy.findByLabelText("Name").type("About Us", { force: true });
        cy.findByLabelText("Href").clear();
        cy.findByLabelText("Href").type("/about-us", { force: true });
        cy.findByText("Submit").click();

        // Verify edited header nav

        cy.findByText("Menu Editor");
        cy.findByText("About Us").should("have.attr", "href", "/about-us");

        // Clear header nav

        cy.findByText("Header").click();
        cy.findByText("Delete").click();

        // Verify cleared header nav

        cy.findByText("Menu Editor");
        cy.findAllByText("About").should("not.exist");
      });

      it("should be able to add to, edit, and clear the footer nav", function () {
        // Add nav item to footer

        cy.findByText("Footer").click();
        cy.findByText("Append").click();
        cy.findByLabelText("Name").type("About", { force: true });
        cy.findByLabelText("Href").type("/about", { force: true });
        cy.findByText("Submit").click();

        // Verify new footer nav

        cy.findByText("Menu Editor");
        cy.findByText("About").should("have.attr", "href", "/about");

        // Edit footer nav

        cy.findByText("Footer").click();

        cy.findByLabelText("Name").clear();
        cy.findByLabelText("Name").type("About Us", { force: true });
        cy.findByLabelText("Href").clear();
        cy.findByLabelText("Href").type("/about-us", { force: true });
        cy.findByText("Submit").click();

        // Verify edited footer nav

        cy.findByText("Menu Editor");
        cy.findByText("About Us").should("have.attr", "href", "/about-us");

        // Clear footer nav

        cy.findByText("Footer").click();
        cy.findByText("Delete").click();

        // Verify cleared footer nav

        cy.findByText("Menu Editor");
        cy.findAllByText("About").should("not.exist");
      });
    });
  });
});
