describe("Git Integration", function () {
  beforeEach(function () {
    cy.resetData();
    cy.initializeContentGit();
  });

  it("should create git commit when creating a note", function () {
    cy.visit("/notes/new");
    cy.findByLabelText("Title *").type("Git Test Note");
    cy.findByRole("button", { name: "Create Note" }).click();

    cy.findByRole("heading", { name: "Git Test Note" });

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Create note: Git Test Note");
    });
  });

  it("should create git commit when updating a note", function () {
    // First create a note
    cy.visit("/notes/new");
    cy.findByLabelText("Title *").type("Note To Update");
    cy.findByRole("button", { name: "Create Note" }).click();

    // Then update it
    cy.findByRole("link", { name: "Edit" }).click();
    cy.findByLabelText("Title *").clear();
    cy.findByLabelText("Title *").type("Updated Note");
    cy.findByRole("button", { name: "Update Note" }).click();

    cy.findByRole("heading", { name: "Updated Note" });

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Update note: Updated Note");
    });
  });

  it("should create git commit when deleting a note", function () {
    // First create a note
    cy.visit("/notes/new");
    cy.findByLabelText("Title *").type("Note To Delete");
    cy.findByRole("button", { name: "Create Note" }).click();

    // Then delete it
    cy.findByRole("link", { name: "Delete" }).click();
    cy.findByRole("button", { name: "Yes, Delete Note" }).click();

    // We should be redirected to the homepage
    cy.findByText("Create New Note");

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Delete note: note-to-delete");
    });
  });

  it("should accumulate commits for multiple operations", function () {
    // Create first note
    cy.visit("/notes/new");
    cy.findByLabelText("Title *").type("First Git Note");
    cy.findByRole("button", { name: "Create Note" }).click();

    // Create second note
    cy.visit("/notes/new");
    cy.findByLabelText("Title *").type("Second Git Note");
    cy.findByRole("button", { name: "Create Note" }).click();

    // Update first note
    cy.visit("/notes/first-git-note/edit");
    cy.findByLabelText("Title *").clear();
    cy.findByLabelText("Title *").type("First Git Note Updated");
    cy.findByRole("button", { name: "Update Note" }).click();

    // We should be redirected to the latest edit's page
    cy.findByText(/Back to all notes/);

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Create note: First Git Note");
      expect(log).to.include("Create note: Second Git Note");
      expect(log).to.include("Update note: First Git Note Updated");
    });
  });
});
