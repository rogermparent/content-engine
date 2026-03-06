/**
 * Fixture Generation Spec
 *
 * This spec generates the test fixtures used by other tests.
 * It should be run explicitly using the `generate-fixtures` script
 * and is NOT included in the normal test suite.
 *
 * Run with: npm run generate-fixtures
 */

describe("Fixture Generation", function () {
  describe("one-resume fixture", function () {
    it("generates one-resume fixture", function () {
      cy.resetData();
      cy.visit("/");

      // Create a resume with all fields populated
      cy.visit("/new-resume");
      cy.findByLabelText("Name").type("Jane Doe");
      cy.findByLabelText("Email").type("jane@example.com");
      cy.findByLabelText("Phone").type("555-1234");
      cy.findByLabelText("Address").type("123 Main St");
      cy.findByLabelText("Github").type("janedoe");
      cy.findByLabelText("LinkedIn").type("janedoe");
      cy.findByLabelText("Website").type("janedoe.dev");
      cy.findByLabelText("Company").type("Acme Corp");
      cy.findByLabelText("Job").type("Software Engineer");
      cy.findByLabelText("Slug").type("acme-corp-engineer");
      cy.findByLabelText("Date (UTC)").type("2023-11-14T00:00");

      cy.findByRole("button", { name: "Submit" }).click();

      // Verify the resume was created
      cy.url().should("include", "/resume/acme-corp-engineer");
      cy.findByText("Software Engineer");

      cy.visit("/");
      cy.findByText("Acme Corp");

      // Copy to fixtures
      cy.copyFixtures("one-resume");
    });
  });
});
