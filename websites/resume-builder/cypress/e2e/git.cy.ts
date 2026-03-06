describe("Git Integration", function () {
  beforeEach(function () {
    cy.resetData();
    cy.initializeContentGit();
  });

  it("should create git commit when creating a resume", function () {
    cy.visit("/new-resume");
    cy.findByLabelText("Company").type("Git Corp");
    cy.findByLabelText("Job").type("Developer");
    cy.findByRole("button", { name: "Submit" }).click();

    cy.url().should("include", "/resume/git-corp-developer");

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Add new resume: git-corp-developer");
    });
  });

  it("should create git commit when updating a resume", function () {
    // First create a resume
    cy.visit("/new-resume");
    cy.findByLabelText("Company").type("Update Corp");
    cy.findByLabelText("Job").type("Engineer");
    cy.findByRole("button", { name: "Submit" }).click();

    // Then update it
    cy.findByRole("link", { name: "Edit" }).click();
    cy.findByLabelText("Company").clear();
    cy.findByLabelText("Company").type("Updated Corp");
    cy.findByRole("button", { name: "Submit" }).click();

    cy.findByText("Updated Corp");

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Update resume: updated-corp-engineer");
    });
  });

  it("should create git commit when deleting a resume", function () {
    // First create a resume
    cy.visit("/new-resume");
    cy.findByLabelText("Company").type("Delete Corp");
    cy.findByLabelText("Job").type("Manager");
    cy.findByRole("button", { name: "Submit" }).click();

    // Then delete it
    cy.findByRole("button", { name: "Delete" }).click();

    // Should redirect to homepage
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Delete resume: delete-corp-manager");
    });
  });

  it("should accumulate commits for multiple operations", function () {
    // Create first resume
    cy.visit("/new-resume");
    cy.findByLabelText("Company").type("First Corp");
    cy.findByLabelText("Job").type("Developer");
    cy.findByRole("button", { name: "Submit" }).click();

    // Create second resume
    cy.visit("/new-resume");
    cy.findByLabelText("Company").type("Second Corp");
    cy.findByLabelText("Job").type("Designer");
    cy.findByRole("button", { name: "Submit" }).click();

    // Update first resume
    cy.visit("/resume/first-corp-developer/edit");
    cy.findByLabelText("Job").clear();
    cy.findByLabelText("Job").type("Senior Developer");
    cy.findByRole("button", { name: "Submit" }).click();

    cy.getContentGitLog().then((log) => {
      expect(log).to.include("Add new resume: first-corp-developer");
      expect(log).to.include("Add new resume: second-corp-designer");
      expect(log).to.include("Update resume: first-corp-senior-developer");
    });
  });
});
