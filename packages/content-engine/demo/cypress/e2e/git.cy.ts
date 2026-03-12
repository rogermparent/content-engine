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

  describe("targeted commits", function () {
    it("should only commit the note's data file when creating", function () {
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Targeted Create Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Targeted Create Note" });

      cy.getContentGitCommitFiles().then((commits) => {
        const createCommit = commits.find((c) =>
          c.message.includes("Create note: Targeted Create Note"),
        );
        expect(createCommit).to.exist;
        expect(createCommit!.files).to.have.length(1);
        expect(createCommit!.files[0]).to.equal(
          "notes/data/targeted-create-note/note.json",
        );
      });
    });

    it("should only commit the note's data file when updating without slug change", function () {
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Targeted Update Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Targeted Update Note" });

      cy.findByRole("link", { name: "Edit" }).click();
      cy.findByLabelText("Title *").clear();
      cy.findByLabelText("Title *").type("Targeted Update Note Edited");
      cy.findByRole("button", { name: "Update Note" }).click();
      cy.findByRole("heading", { name: "Targeted Update Note Edited" });

      cy.getContentGitCommitFiles().then((commits) => {
        const updateCommit = commits.find((c) =>
          c.message.includes("Update note: Targeted Update Note Edited"),
        );
        expect(updateCommit).to.exist;
        expect(updateCommit!.files).to.have.length(1);
        expect(updateCommit!.files[0]).to.equal(
          "notes/data/targeted-update-note/note.json",
        );
      });
    });

    it("should commit old and new data dirs when updating with slug change", function () {
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Slug Change Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Slug Change Note" });

      cy.findByRole("link", { name: "Edit" }).click();
      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("renamed-slug-note");
      cy.findByRole("button", { name: "Update Note" }).click();
      cy.location("pathname").should("eq", "/notes/renamed-slug-note");

      cy.getContentGitCommitFiles().then((commits) => {
        const updateCommit = commits.find((c) =>
          c.message.includes("Update note: Slug Change Note"),
        );
        expect(updateCommit).to.exist;
        // Should include the old dir (deleted) and new dir (created)
        const files = updateCommit!.files;
        expect(files.some((f) => f.includes("slug-change-note"))).to.be.true;
        expect(files.some((f) => f.includes("renamed-slug-note"))).to.be.true;
      });
    });

    it("should only commit the deleted note's directory when deleting", function () {
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Targeted Delete Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Targeted Delete Note" });

      cy.findByRole("link", { name: "Delete" }).click();
      cy.findByRole("button", { name: "Yes, Delete Note" }).click();
      cy.findByText("Create New Note");

      cy.getContentGitCommitFiles().then((commits) => {
        const deleteCommit = commits.find((c) =>
          c.message.includes("Delete note: targeted-delete-note"),
        );
        expect(deleteCommit).to.exist;
        expect(deleteCommit!.files).to.have.length(1);
        expect(deleteCommit!.files[0]).to.equal(
          "notes/data/targeted-delete-note/note.json",
        );
      });
    });

    it("should commit both renamed note and updated bookmark files on reference update", function () {
      // Create a note
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Ref Update Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Ref Update Note" });

      // Create a bookmark for this note
      cy.findByRole("link", { name: "Bookmark" }).click();
      cy.findByLabelText("Label *").type("Ref Update Bookmark");
      cy.findByRole("button", { name: "Create Bookmark" }).click();
      cy.findByRole("heading", { name: "Ref Update Bookmark" });

      // Rename the note's slug
      cy.visit("/notes/ref-update-note/edit");
      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("ref-note-renamed");
      cy.findByRole("button", { name: "Update Note" }).click();
      cy.location("pathname").should("eq", "/notes/ref-note-renamed");

      cy.getContentGitCommitFiles().then((commits) => {
        const updateCommit = commits.find((c) =>
          c.message.includes("Update note: Ref Update Note"),
        );
        expect(updateCommit).to.exist;
        const files = updateCommit!.files;
        // Should include the note's new data dir and the bookmark's data file
        expect(files.some((f) => f.includes("ref-note-renamed"))).to.be.true;
        expect(files.some((f) => f.includes("bookmarks/data/"))).to.be.true;
      });
    });
  });

  describe("reference updates", function () {
    it("should update bookmark reference when note slug changes", function () {
      // Create a note
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Note To Bookmark");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Note To Bookmark" });

      // Create a bookmark for this note
      cy.findByRole("link", { name: "Bookmark" }).click();
      cy.findByLabelText("Label *").type("My Bookmark");
      cy.findByRole("button", { name: "Create Bookmark" }).click();

      // Verify bookmark was created and shows the note reference
      cy.findByRole("heading", { name: "My Bookmark" });
      cy.findByText("References note:")
        .parent()
        .should("contain", "note-to-bookmark");

      // Go back to home and verify bookmark shows on homepage
      cy.visit("/");
      cy.findByRole("heading", { name: "Bookmarks" });
      cy.findByText("My Bookmark");
      cy.findByText("References: note-to-bookmark");

      // Now edit the note and change its slug
      cy.visit("/notes/note-to-bookmark/edit");
      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("renamed-note");
      cy.findByRole("button", { name: "Update Note" }).click();

      // Verify note is accessible at new URL
      cy.location("pathname").should("eq", "/notes/renamed-note");
      cy.findByRole("heading", { name: "Note To Bookmark" });

      // Go back to home and verify bookmark reference was updated
      cy.visit("/");
      cy.findByText("My Bookmark");
      cy.findByText("References: renamed-note");

      // Click the bookmark and verify it links to the renamed note
      cy.findByText("My Bookmark").click();
      cy.findByRole("heading", { name: "My Bookmark" });
      cy.findByText("References note:")
        .parent()
        .should("contain", "renamed-note");
      cy.findByRole("link", { name: /View Note:/ }).click();
      cy.location("pathname").should("eq", "/notes/renamed-note");
    });

    it("should update multiple bookmarks when note slug changes", function () {
      // Create a note
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Multi Bookmark Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Multi Bookmark Note" });

      // Create first bookmark
      cy.findByRole("link", { name: "Bookmark" }).click();
      cy.findByLabelText("Label *").type("First Bookmark");
      cy.findByRole("button", { name: "Create Bookmark" }).click();
      cy.findByRole("heading", { name: "First Bookmark" });

      // Create second bookmark - navigate back to the note first
      cy.visit("/notes/multi-bookmark-note");
      cy.findByRole("heading", { name: "Multi Bookmark Note" });
      cy.findByRole("link", { name: "Bookmark" }).click();
      cy.findByLabelText("Label *").type("Second Bookmark");
      cy.findByRole("button", { name: "Create Bookmark" }).click();
      cy.findByRole("heading", { name: "Second Bookmark" });

      // Change the note's slug
      cy.visit("/notes/multi-bookmark-note/edit");
      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("new-slug");
      cy.findByRole("button", { name: "Update Note" }).click();
      cy.location("pathname").should("eq", "/notes/new-slug");

      // Verify both bookmarks reference the new slug
      cy.visit("/");
      cy.findByText("First Bookmark")
        .parent()
        .should("contain", "References: new-slug");
      cy.findByText("Second Bookmark")
        .parent()
        .should("contain", "References: new-slug");
    });

    it("should not affect bookmarks for other notes", function () {
      // Create Note A
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Note A");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Note A" });
      cy.findByRole("link", { name: "Bookmark" }).click();
      cy.findByLabelText("Label *").type("Bookmark A");
      cy.findByRole("button", { name: "Create Bookmark" }).click();
      cy.findByRole("heading", { name: "Bookmark A" });

      // Create Note B
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("Note B");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "Note B" });
      cy.findByRole("link", { name: "Bookmark" }).click();
      cy.findByLabelText("Label *").type("Bookmark B");
      cy.findByRole("button", { name: "Create Bookmark" }).click();
      cy.findByRole("heading", { name: "Bookmark B" });

      // Change Note A's slug
      cy.visit("/notes/note-a/edit");
      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("note-a-renamed");
      cy.findByRole("button", { name: "Update Note" }).click();
      cy.location("pathname").should("eq", "/notes/note-a-renamed");

      // Verify bookmarks reference correct notes
      cy.visit("/");
      cy.findByText("Bookmark A")
        .parent()
        .should("contain", "References: note-a-renamed");
      cy.findByText("Bookmark B")
        .parent()
        .should("contain", "References: note-b");
    });

    it("should handle slug change when no bookmarks reference the note", function () {
      // Create a note without any bookmarks
      cy.visit("/notes/new");
      cy.findByLabelText("Title *").type("No Bookmarks Note");
      cy.findByRole("button", { name: "Create Note" }).click();
      cy.findByRole("heading", { name: "No Bookmarks Note" });

      // Change the note's slug (should not error even with no referencing bookmarks)
      cy.findByRole("link", { name: "Edit" }).click();
      cy.findByLabelText("Slug").clear();
      cy.findByLabelText("Slug").type("renamed-no-bookmarks");
      cy.findByRole("button", { name: "Update Note" }).click();

      // Verify note is accessible at new URL
      cy.location("pathname").should("eq", "/notes/renamed-no-bookmarks");
      cy.findByRole("heading", { name: "No Bookmarks Note" });

      // Verify git commit was created
      cy.getContentGitLog().then((log) => {
        expect(log).to.satisfy((l: string | string[]) => {
          const str = Array.isArray(l) ? l.join(" ") : l;
          return str.includes("No Bookmarks Note");
        });
      });
    });
  });
});
