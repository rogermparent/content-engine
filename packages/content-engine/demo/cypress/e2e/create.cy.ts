describe("Notes Create Operations", function () {
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
      cy.findByLabelText("Content").type(
        "This is the content of my test note.",
      );
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

    it("should create a note with a custom date", function () {
      cy.findByRole("link", { name: "Create New Note" }).click();

      cy.findByLabelText("Title *").type("Note With Custom Date");
      cy.findByLabelText("Content").type("This note has a custom date.");
      cy.findByLabelText(/Date/).type("2023-06-15T10:30");

      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByRole("heading", { name: "Note With Custom Date" });
      // Date should show the custom date (format varies by locale)
      cy.findByText(/6\/15\/2023|15\/06\/2023/);
    });
  });

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

    it("should handle multiline content", function () {
      cy.findByLabelText("Title *").type("Multiline Note");
      cy.findByLabelText("Content").type(
        "Line 1\nLine 2\nLine 3\n\nParagraph 2",
      );
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText(/Line 1/);
      cy.findByText(/Line 2/);
      cy.findByText(/Paragraph 2/);
    });

    it("should handle content with code-like text", function () {
      cy.findByLabelText("Title *").type("Code Note");
      cy.findByLabelText("Content").type("function test() { return true; }", {
        parseSpecialCharSequences: false,
      });
      cy.findByRole("button", { name: "Create Note" }).click();

      cy.findByText("function test() { return true; }");
    });

    it("should handle content with URLs", function () {
      cy.findByLabelText("Title *").type("URL Note");
      cy.findByLabelText("Content").type(
        "Check out https://example.com for more info",
      );
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
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i + 1}`).join(
        ", ",
      );
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
});
