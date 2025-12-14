describe("Edge Cases and Special Scenarios", function () {
  describe("Slug Handling", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/notes/new");
    });

    it("should handle titles with multiple spaces", function () {
      cy.findByLabelText("Title *").type("Title   with   multiple   spaces");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.url().should("include", "/notes/title-with-multiple-spaces");
    });

    it("should handle titles with leading/trailing spaces", function () {
      cy.findByLabelText("Title *").type("  Trimmed Title  ");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.url().should("include", "/notes/trimmed-title");
    });

    it("should handle titles with numbers", function () {
      cy.findByLabelText("Title *").type("Note 123 Test");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.url().should("include", "/notes/note-123-test");
    });

    it("should handle title that is all special characters", function () {
      cy.findByLabelText("Title *").type("!!!###$$$");
      cy.findByLabelText(/Slug/).type("special-chars-slug");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.url().should("include", "/notes/special-chars-slug");
    });

    it("should preserve custom slug exactly as entered", function () {
      cy.findByLabelText("Title *").type("My Title");
      cy.findByLabelText(/Slug/).type("MY-CUSTOM-Slug-123");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.url().should("include", "/notes/MY-CUSTOM-Slug-123");
    });
  });

  describe("Content Edge Cases", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/notes/new");
    });

    it("should handle very long content", function () {
      cy.findByLabelText("Title *").type("Long Content Note");
      cy.findByLabelText("Content").type("x".repeat(5000));
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("heading", { name: "Long Content Note" });
    });

    it("should handle multiline content", function () {
      cy.findByLabelText("Title *").type("Multiline Note");
      cy.findByLabelText("Content").type("Line 1\nLine 2\nLine 3\n\nParagraph 2");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText(/Line 1/);
      cy.findByText(/Line 2/);
      cy.findByText(/Paragraph 2/);
    });

    it("should handle content with code-like text", function () {
      cy.findByLabelText("Title *").type("Code Note");
      cy.findByLabelText("Content").type("function test() { return true; }");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("function test() { return true; }");
    });

    it("should handle content with URLs", function () {
      cy.findByLabelText("Title *").type("URL Note");
      cy.findByLabelText("Content").type("Check out https://example.com for more info");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("Check out https://example.com for more info");
    });
  });

  describe("Tags Edge Cases", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/notes/new");
    });

    it("should handle tags with extra whitespace", function () {
      cy.findByLabelText("Title *").type("Tags Whitespace Note");
      cy.findByLabelText(/Tags/).type("  tag1  ,  tag2  ,  tag3  ");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("tag1");
      cy.findByText("tag2");
      cy.findByText("tag3");
    });

    it("should handle many tags", function () {
      cy.findByLabelText("Title *").type("Many Tags Note");
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i + 1}`).join(", ");
      cy.findByLabelText(/Tags/).type(manyTags);
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("tag1");
      cy.findByText("tag20");
    });

    it("should ignore empty tags from double commas", function () {
      cy.findByLabelText("Title *").type("Empty Tags Note");
      cy.findByLabelText(/Tags/).type("tag1,,tag2,,,tag3");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("tag1");
      cy.findByText("tag2");
      cy.findByText("tag3");
    });

    it("should handle tags with hyphens and underscores", function () {
      cy.findByLabelText("Title *").type("Punctuated Tags Note");
      cy.findByLabelText(/Tags/).type("tag-with-hyphens, tag_with_underscores");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("tag-with-hyphens");
      cy.findByText("tag_with_underscores");
    });
  });

  describe("Rapid Operations", function () {
    beforeEach(function () {
      cy.resetData();
    });

    it("should handle creating multiple notes in sequence", function () {
      for (let i = 1; i <= 3; i++) {
        cy.visit("/notes/new");
        cy.findByLabelText("Title *").type(`Rapid Note ${i}`);
        cy.findByRole("button", { name: "Create Note" }).click();
        cy.findByRole("heading", { name: `Rapid Note ${i}` });
      }

      cy.visit("/");
      cy.findByText("Total notes: 3");
    });

    it("should handle create then immediate edit", function () {
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Quick Create");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("link", { name: "Edit" }).click();
      cy.findByLabelText("Title *").clear();
      cy.findByLabelText("Title *").type("Quick Edit");
      cy.findByRole("button", { name: "Update Note" }).click();

      cy.findByRole("heading", { name: "Quick Edit" });
    });

    it("should handle create then immediate delete", function () {
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Quick Delete");
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("link", { name: "Delete" }).click();
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();

      cy.findByText("No notes yet. Create your first note!");
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
});
