describe("Notes Update Operations", function () {
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

    it("should preserve date when updating without changing date field", function () {
      // Store the original date before editing
      cy.findByText(/\d{1,2}\/\d{1,2}\/\d{4}/).then(($date) => {
        const originalDate = $date.text();

        cy.findByRole("link", { name: "Edit" }).click();

        cy.findByLabelText("Title *").clear();
        cy.findByLabelText("Title *").type("Updated but same date");

        cy.findByRole("button", { name: "Update Note" }).click();

        // Date should still show the original timestamp
        cy.findByText(originalDate);
      });
    });

    it("should update note date", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText(/Date/).clear();
      cy.findByLabelText(/Date/).type("2024-03-20T14:45");

      cy.findByRole("button", { name: "Update Note" }).click();

      // Date should show the new date (format varies by locale)
      cy.findByText(/3\/20\/2024|20\/03\/2024/);
    });

    it("should clear tags when tags field is emptied", function () {
      cy.findByRole("link", { name: "Edit" }).click();

      cy.findByLabelText(/Tags/).clear();

      cy.findByRole("button", { name: "Update Note" }).click();

      // No tag badges should be visible
      cy.get('[style*="background-color: rgb(240, 240, 240)"]').should(
        "not.exist",
      );
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
});
