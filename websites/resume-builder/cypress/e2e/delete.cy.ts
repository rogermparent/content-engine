describe("Resume Delete Operations", function () {
  describe("Delete Operations", function () {
    beforeEach(function () {
      cy.resetData("one-resume");
    });

    it("should delete resume and redirect to homepage", function () {
      cy.visit("/resume/acme-corp-engineer");
      cy.findByRole("button", { name: "Delete" }).click();

      cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("should show empty state after deleting the only resume", function () {
      cy.visit("/resume/acme-corp-engineer");
      cy.findByRole("button", { name: "Delete" }).click();

      cy.findByText("There are no resumes yet.");
    });

    it("should not show deleted resume on homepage", function () {
      cy.visit("/resume/acme-corp-engineer");
      cy.findByRole("button", { name: "Delete" }).click();

      cy.findByText("Acme Corp").should("not.exist");
    });

    it("should return 404 after deleting resume", function () {
      cy.visit("/resume/acme-corp-engineer");
      cy.findByRole("button", { name: "Delete" }).click();

      // Confirm redirect completed
      cy.url().should("eq", Cypress.config().baseUrl + "/");

      // Deleted slug should return 404
      cy.request({
        url: "/resume/acme-corp-engineer",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });
});
