describe("Notes Read Operations", function () {
  describe("Read Operations", function () {
    beforeEach(function () {
      cy.resetData("three-notes");
      cy.visit("/");
    });

    it("should display notes in reverse chronological order (newest first)", function () {
      cy.checkNoteTitlesInOrder(["Third Note", "Second Note", "First Note"]);
    });

    it("should display total count of notes", function () {
      cy.findByText("Total notes: 3");
    });

    it("should navigate to note detail page", function () {
      cy.findByRole("link", { name: "Second Note" }).click();

      cy.url().should("include", "/notes/second-note");
      cy.findByRole("heading", { name: "Second Note" });
      // Content may be split across lines, so check for partial text matches
      cy.contains("This is the content of the second note");
      cy.contains("It has multiple paragraphs");
    });

    it("should display tags on note detail page", function () {
      cy.findByRole("link", { name: "First Note" }).click();

      cy.findByText("important");
      cy.findByText("work");
    });

    it("should display note without tags correctly", function () {
      cy.findByRole("link", { name: "Third Note" }).click();

      cy.findByRole("heading", { name: "Third Note" });
      cy.findByText("This is the newest note without tags.");
      // No tag badges should be visible
      cy.get('[style*="background-color: rgb(240, 240, 240)"]').should(
        "not.exist",
      );
    });

    it("should show 404 for non-existent note", function () {
      cy.request({
        url: "/notes/non-existent-note",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should have Edit and Delete links on note detail page", function () {
      cy.findByRole("link", { name: "First Note" }).click();

      cy.findByRole("link", { name: "Edit" });
      cy.findByRole("link", { name: "Delete" });
    });

    it("should have back link to homepage", function () {
      cy.findByRole("link", { name: "First Note" }).click();

      cy.findByRole("link", { name: /Back to all notes/ }).click();

      cy.url().should("eq", Cypress.config().baseUrl + "/");
    });
  });

  describe("Date Display", function () {
    beforeEach(function () {
      cy.resetData("three-notes");
    });

    it("should display dates on list page", function () {
      cy.visit("/");
      // The fixture dates are around Nov 2023
      cy.findAllByRole("listitem").each(($el) => {
        cy.wrap($el).contains(/\d{1,2}\/\d{1,2}\/2023/);
      });
    });

    it("should display date on detail page", function () {
      cy.visit("/notes/first-note");
      cy.contains(/\d{1,2}\/\d{1,2}\/2023/);
    });
  });

  describe("Concurrent-like Operations", function () {
    beforeEach(function () {
      cy.resetData("three-notes");
    });

    it("should handle viewing different notes in sequence", function () {
      cy.visit("/notes/first-note");
      cy.findByRole("heading", { name: "First Note" });

      cy.findByRole("link", { name: /Back to all notes/ }).click();
      cy.findByRole("link", { name: "Second Note" }).click();
      cy.findByRole("heading", { name: "Second Note" });

      cy.findByRole("link", { name: /Back to all notes/ }).click();
      cy.findByRole("link", { name: "Third Note" }).click();
      cy.findByRole("heading", { name: "Third Note" });
    });
  });

  describe("Navigation Edge Cases", function () {
    beforeEach(function () {
      cy.resetData("three-notes");
    });

    it("should handle direct URL navigation to view page", function () {
      cy.visit("/notes/first-note");
      cy.findByRole("heading", { name: "First Note" });
    });

    it("should handle direct URL navigation to edit page", function () {
      cy.visit("/notes/first-note/edit");
      cy.findByRole("heading", { name: "Edit Note" });
      cy.findByLabelText("Title *").should("have.value", "First Note");
    });

    it("should handle direct URL navigation to delete page", function () {
      cy.visit("/notes/first-note/delete");
      cy.findByRole("heading", { name: "Delete Note" });
      cy.findByText("First Note");
    });

    it("should handle browser back button after create", function () {
      cy.visit("/");
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByLabelText("Title *").type("Back Button Test");
      cy.findByRole("button", { name: "Create Note" }).click();

      // Wait for redirect to note page
      cy.url().should("include", "/notes/back-button-test");

      // Go back twice: note page -> create page -> homepage
      cy.go("back");
      cy.go("back");

      cy.url().should("eq", Cypress.config().baseUrl + "/");
    });
  });

  describe("Empty State Transitions", function () {
    it("should transition from empty to having notes", function () {
      cy.resetData();
      cy.visit("/");

      cy.findByText("No notes yet. Create your first note!");

      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByLabelText("Title *").type("First Ever Note");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.visit("/");
      cy.findByText("No notes yet").should("not.exist");
      cy.findByRole("link", { name: "First Ever Note" });
    });

    it("should transition from having notes to empty", function () {
      cy.resetData("one-note");
      cy.visit("/");

      cy.findByRole("link", { name: "Existing Note" });

      cy.visit("/notes/existing-note/delete");
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();

      cy.findByText("No notes yet. Create your first note!");
    });
  });
});
