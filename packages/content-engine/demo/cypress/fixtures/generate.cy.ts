/**
 * Fixture Generation Spec
 *
 * This spec generates the test fixtures used by other tests.
 * It should be run explicitly using the `generate-fixtures` script
 * and is NOT included in the normal test suite.
 *
 * Run with: pnpm generate-fixtures
 */

describe("Fixture Generation", function () {
  describe("one-note fixture", function () {
    it("generates one-note fixture", function () {
      cy.resetData();
      cy.visit("/");

      // Create "Existing Note"
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByLabelText("Title *").type("Existing Note");
      cy.findByLabelText(/Slug/).type("existing-note");
      cy.findByLabelText("Content").type(
        "This note already exists for testing updates and deletes.",
      );
      cy.findByLabelText(/Tags/).type("test");
      cy.findByLabelText(/Date/).type("2023-11-14T00:00");
      cy.findByRole("button", { name: "Create Note" }).click();

      // Verify the note was created
      cy.findByRole("heading", { name: "Existing Note" });

      // Copy to fixtures
      cy.copyFixtures("one-note");
    });
  });

  describe("three-notes fixture", function () {
    it("generates three-notes fixture", function () {
      cy.resetData();
      cy.visit("/");

      // Create "First Note" (oldest)
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByLabelText("Title *").type("First Note");
      cy.findByLabelText(/Slug/).type("first-note");
      cy.findByLabelText("Content").type("This is the first note content.");
      cy.findByLabelText(/Tags/).type("important, work");
      cy.findByLabelText(/Date/).type("2023-10-01T00:00");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "First Note" });

      // Create "Second Note" (middle)
      cy.visit("/");
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByLabelText("Title *").type("Second Note");
      cy.findByLabelText(/Slug/).type("second-note");
      cy.findByLabelText("Content").type(
        "This is the content of the second note.\n\nIt has multiple paragraphs.",
      );
      cy.findByLabelText(/Date/).type("2023-11-01T00:00");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Second Note" });

      // Create "Third Note" (newest, no tags)
      cy.visit("/");
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByLabelText("Title *").type("Third Note");
      cy.findByLabelText(/Slug/).type("third-note");
      cy.findByLabelText("Content").type(
        "This is the newest note without tags.",
      );
      cy.findByLabelText(/Date/).type("2023-11-15T00:00");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Third Note" });

      // Verify all notes are on the homepage in correct order
      cy.visit("/");
      cy.checkNoteTitlesInOrder(["Third Note", "Second Note", "First Note"]);

      // Copy to fixtures
      cy.copyFixtures("three-notes");
    });
  });
});
