describe("Single Project View", function () {
  describe("with seven items", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/project/project-6");
    });

    it("should display a project", function () {
      cy.findByText("Project 6");
    });

    it("should not need authorization", function () {
      cy.findByText("Sign In");
    });

    it("should be able to multiply ingredient amounts", function () {
      cy.findByText("1 1/2 tsp salt");
      cy.findByText("Sprinkle 1/2 tsp salt in water");
      cy.findByLabelText("Multiply").type("2");
      cy.findByText("3 tsp salt");
      cy.findByText("Sprinkle 1 tsp salt in water");
    });

    it("should be able to edit a project", function () {
      cy.findByText("Edit").click();

      cy.fillSignInForm();

      cy.findByText("Editing Project: Project 6", { timeout: 10000 });

      cy.findByText("Advanced").click();

      const editedProject = "Edited Project";

      cy.findAllByLabelText("Name").first().clear();
      cy.findAllByLabelText("Name").first().type(editedProject);

      const projectDate = "2023-12-08T01:16:12.622";
      cy.findByLabelText("Date (UTC)").should("have.value", projectDate);

      cy.findByText("Submit").click();

      cy.findByText(editedProject);

      cy.visit("/");
      cy.findByText(editedProject);
      cy.checkNamesInOrder([
        "Project 7",
        editedProject,
        "Project 5",
        "Project 4",
        "Project 3",
        "Project 2",
      ]);

      // Project date should not have changed
      cy.findByText(new Date(projectDate + "Z").toLocaleString());
    });

    it("should be able to delete the project", function () {
      cy.findByText("Delete").click();

      // First click of the delete button should trigger a sign-in
      cy.fillSignInForm();

      cy.findByText("Delete").click();

      cy.findByText("Project 4");
      cy.checkNamesInOrder([
        "Project 7",
        "Project 5",
        "Project 4",
        "Project 3",
        "Project 2",
        "Project 1",
      ]);
      cy.request({
        url: "/project/project-6",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });
  });

  it("should have status 404 when project doesn't exist", function () {
    cy.request({
      url: "/project/non-existent-project",
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 404);
  });
});
