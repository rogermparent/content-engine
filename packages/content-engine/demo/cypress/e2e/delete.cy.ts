describe("Notes Delete Operations", function () {
  describe("Delete Operations", function () {
    beforeEach(function () {
      cy.resetData("three-notes");
    });

    it("should show delete confirmation page", function () {
      cy.visit("/notes/first-note");
      cy.findByRole("link", { name: "Delete" }).click();

      cy.findByRole("heading", { name: "Delete Note" });
      cy.findByText("Are you sure you want to delete this note?");
      cy.findByText("First Note");
    });

    it("should delete note and redirect to homepage", function () {
      cy.visit("/notes/second-note");
      cy.findByRole("link", { name: "Delete" }).click();
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();

      cy.url().should("eq", Cypress.config().baseUrl + "/");
      cy.findByText("Total notes: 2");
      cy.findByRole("link", { name: "Second Note" }).should("not.exist");
    });

    it("should cancel delete and return to view page", function () {
      cy.visit("/notes/first-note");
      cy.findByRole("link", { name: "Delete" }).click();
      cy.findByRole("link", { name: "Cancel" }).click();

      cy.url().should("include", "/notes/first-note");
      cy.findByRole("heading", { name: "First Note" });
    });

    it("should remove note from index after deletion", function () {
      cy.visit("/notes/third-note");
      cy.findByRole("link", { name: "Delete" }).click();
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();

      cy.checkNoteTitlesInOrder(["Second Note", "First Note"]);

      // Deleted note should return 404
      cy.request({
        url: "/notes/third-note",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should delete all notes one by one", function () {
      // Delete first note
      cy.visit("/notes/first-note/delete");
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();
      cy.findByText("Total notes: 2");

      // Delete second note
      cy.visit("/notes/second-note/delete");
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();
      cy.findByText("Total notes: 1");

      // Delete third note
      cy.visit("/notes/third-note/delete");
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();

      cy.findByText("No notes yet. Create your first note!");
      cy.findByText("Total notes: 0");
    });

    it("should show 404 for deleting non-existent note", function () {
      cy.request({
        url: "/notes/non-existent-note/delete",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });
});
