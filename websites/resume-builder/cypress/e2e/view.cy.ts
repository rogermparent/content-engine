describe("Resume View Operations", function () {
  describe("View Operations", function () {
    beforeEach(function () {
      cy.resetData("one-resume");
      cy.visit("/resume/acme-corp-engineer");
    });

    it("should display job title and company", function () {
      cy.findByText("Software Engineer");
      cy.findByText("Acme Corp");
    });

    it("should display contact info fields", function () {
      cy.findByText("Jane Doe");
      cy.findByText("jane@example.com");
      cy.findByText("555-1234");
      cy.findByText("123 Main St");
      cy.findByText(/github.com\/janedoe/);
      cy.findByText(/linkedin.com\/in\/janedoe/);
      cy.findByText("janedoe.dev");
    });

    it("should show Edit and Copy links", function () {
      cy.findByRole("link", { name: "Edit" });
      cy.findByRole("link", { name: "Copy" });
    });

    it("should show Delete button", function () {
      cy.findByRole("button", { name: "Delete" });
    });

    it("should navigate to edit page", function () {
      cy.findByRole("link", { name: "Edit" }).click();
      cy.url().should("include", "/resume/acme-corp-engineer/edit");
    });

    it("should navigate to copy page", function () {
      cy.findByRole("link", { name: "Copy" }).click();
      cy.url().should("include", "/resume/acme-corp-engineer/copy");
    });
  });

  describe("404 Handling", function () {
    beforeEach(function () {
      cy.resetData("one-resume");
    });

    it("should return 404 for non-existent slug", function () {
      cy.request({
        url: "/resume/non-existent-slug",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });
});
