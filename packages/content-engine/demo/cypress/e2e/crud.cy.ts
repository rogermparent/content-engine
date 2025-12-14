describe("Notes CRUD Operations", function () {
  describe("Create Operations", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/");
    });

    it("should display empty state when no notes exist", function () {
      cy.findByText("No notes yet. Create your first note!");
      cy.findByText("Total notes: 0");
    });

    it("should create a new note with all fields", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByRole("heading", { name: "Create New Note" });

      cy.findByLabelText("Title *").type("My Test Note");
      cy.findByLabelText(/Slug/).type("my-custom-slug");
      cy.findByLabelText("Content").type("This is the content of my test note.");
      cy.findByLabelText(/Tags/).type("tag1, tag2, tag3");

      cy.findByRole("button", { name: "Create Note" }).click();

      // Should redirect to view page
      cy.findByRole("heading", { name: "My Test Note" });
      cy.findByText("This is the content of my test note.");
      cy.findByText("tag1");
      cy.findByText("tag2");
      cy.findByText("tag3");

      // URL should use custom slug
      cy.url().should("include", "/notes/my-custom-slug");
    });

    it("should auto-generate slug from title when slug is not provided", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();

      cy.findByLabelText("Title *").type("Auto Generated Slug Test");
      cy.findByLabelText("Content").type("Testing auto-generated slug.");

      cy.findByRole("button", { name: "Create Note" }).click();

      // Should redirect to view page with auto-generated slug
      cy.url().should("include", "/notes/auto-generated-slug-test");
      cy.findByRole("heading", { name: "Auto Generated Slug Test" });
    });

    it("should create a note with only title (minimum required)", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();

      cy.findByLabelText("Title *").type("Minimal Note");

      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("heading", { name: "Minimal Note" });
      cy.findByText("No content");
    });

    it("should show the new note in the list on homepage", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();

      cy.findByLabelText("Title *").type("Listed Note");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.visit("/");
      cy.findByRole("link", { name: "Listed Note" });
      cy.findByText("Total notes: 1");
    });

    it("should handle special characters in title and content", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();

      cy.findByLabelText("Title *").type('Note with "quotes" & <tags>');
      cy.findByLabelText("Content").type("Content with special chars: <>&\"'");

      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("heading", { name: 'Note with "quotes" & <tags>' });
      cy.findByText("Content with special chars: <>&\"'");
    });

    it("should handle unicode characters", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();

      cy.findByLabelText("Title *").type("Unicode: 日本語 中文 한국어");
      cy.findByLabelText("Content").type("Emoji content: 🎉 🚀 💻");

      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("heading", { name: "Unicode: 日本語 中文 한국어" });
      cy.findByText("Emoji content: 🎉 🚀 💻");
    });

    it("should cancel creation and return to homepage", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();
      cy.findByRole("heading", { name: "Create New Note" });

      cy.findByRole("link", { name: "Cancel" }).click();

      cy.url().should("eq", Cypress.config().baseUrl + "/");
    });
  });

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
      cy.findByText("This is the content of the second note.");
      cy.findByText("It has multiple paragraphs.");
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
      cy.get('[style*="background-color: rgb(240, 240, 240)"]').should("not.exist");
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

  describe("Update Operations", function () {
    beforeEach(function () {
      cy.resetData("one-note");
      cy.visit("/notes/existing-note");
    });

    it("should display edit form with existing values", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByRole("heading", { name: "Edit Note" });
      cy.findByLabelText("Title *").should("have.value", "Existing Note");
      cy.findByLabelText(/Slug/).should("have.value", "existing-note");
      cy.findByLabelText("Content").should(
        "have.value",
        "This note already exists for testing updates and deletes.",
      );
      cy.findByLabelText(/Tags/).should("have.value", "test");
    });

    it("should update note title", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Title *").clear();
      cy.findByLabelText("Title *").type("Updated Note Title");

      cy.findByRole("button", { name: "Update Note" }).click();

      cy.findByRole("heading", { name: "Updated Note Title" });
    });

    it("should update note content", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Content").clear();
      cy.findByLabelText("Content").type("This is the updated content.");

      cy.findByRole("button", { name: "Update Note" }).click();

      cy.findByText("This is the updated content.");
    });

    it("should update note tags", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText(/Tags/).clear();
      cy.findByLabelText(/Tags/).type("new-tag, another-tag");

      cy.findByRole("button", { name: "Update Note" }).click();

      cy.findByText("new-tag");
      cy.findByText("another-tag");
      cy.findByText("test").should("not.exist");
    });

    it("should update note slug and redirect correctly", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText(/Slug/).clear();
      cy.findByLabelText(/Slug/).type("new-slug-for-note");

      cy.findByRole("button", { name: "Update Note" }).click();

      cy.url().should("include", "/notes/new-slug-for-note");
      cy.findByRole("heading", { name: "Existing Note" });

      // Old slug should not work
      cy.request({
        url: "/notes/existing-note",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should update all fields at once", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Title *").clear();
      cy.findByLabelText("Title *").type("Completely New Title");

      cy.findByLabelText(/Slug/).clear();
      cy.findByLabelText(/Slug/).type("completely-new-slug");

      cy.findByLabelText("Content").clear();
      cy.findByLabelText("Content").type("Completely new content here.");

      cy.findByLabelText(/Tags/).clear();
      cy.findByLabelText(/Tags/).type("alpha, beta, gamma");

      cy.findByRole("button", { name: "Update Note" }).click();

      cy.url().should("include", "/notes/completely-new-slug");
      cy.findByRole("heading", { name: "Completely New Title" });
      cy.findByText("Completely new content here.");
      cy.findByText("alpha");
      cy.findByText("beta");
      cy.findByText("gamma");
    });

    it("should cancel edit and return to view page", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Title *").clear();
      cy.findByLabelText("Title *").type("Should Not Be Saved");

      cy.findByRole("link", { name: "Cancel" }).click();

      cy.findByRole("heading", { name: "Existing Note" });
      cy.findByText("Should Not Be Saved").should("not.exist");
    });

    it("should preserve date when updating", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText("Title *").clear();
      cy.findByLabelText("Title *").type("Updated but same date");

      cy.findByRole("button", { name: "Update Note" }).click();

      // Date should still show the original timestamp
      cy.findByText(/11\/14\/2023|14\/11\/2023/); // Date format varies by locale
    });

    it("should clear tags when tags field is emptied", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText(/Tags/).clear();

      cy.findByRole("button", { name: "Update Note" }).click();

      // No tag badges should be visible
      cy.get('[style*="background-color: rgb(240, 240, 240)"]').should("not.exist");
    });

    it("should show 404 for editing non-existent note", function () {
      cy.request({
        url: "/notes/non-existent-note/edit",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });

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
