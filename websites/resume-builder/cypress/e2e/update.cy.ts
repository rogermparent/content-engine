describe("Resume Update Operations", function () {
  describe("Update Operations", function () {
    beforeEach(function () {
      cy.resetData("one-resume");
      cy.visit("/resume/acme-corp-engineer");
    });

    it("should display edit form pre-populated with company and job", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Company").should("have.value", "Acme Corp");
      cy.findByLabelText("Job").should("have.value", "Software Engineer");
    });

    it("should display edit form with slug pre-populated", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Slug").should("have.value", "acme-corp-engineer");
    });

    it("should update company field", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Company").clear();
      cy.findByLabelText("Company").type("New Company");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("New Company");
    });

    it("should update job field", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Job").clear();
      cy.findByLabelText("Job").type("Senior Engineer");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("Senior Engineer");
    });

    it("should update applicant fields", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Name").clear();
      cy.findByLabelText("Name").type("Updated Name");
      cy.findByLabelText("Email").clear();
      cy.findByLabelText("Email").type("updated@example.com");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("Updated Name");
      cy.findByText("updated@example.com");
    });

    it("should update slug and redirect to new URL", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("new-slug-for-resume");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.url().should("include", "/resume/new-slug-for-resume");

      // Old URL should return 404
      cy.request({
        url: "/resume/acme-corp-engineer",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should cancel edit and return to view page without saving", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Company").clear();
      cy.findByLabelText("Company").type("Should Not Be Saved");

      cy.findByRole("link", { name: "Cancel" }).click();

      cy.url().should("include", "/resume/acme-corp-engineer");
      cy.findByText("Should Not Be Saved").should("not.exist");
    });

    it("should show 404 for editing non-existent resume", function () {
      cy.request({
        url: "/resume/non-existent-resume/edit",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });
});
