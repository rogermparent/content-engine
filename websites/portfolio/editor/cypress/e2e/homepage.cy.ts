describe("Index Page", function () {
  describe("when empty", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/");
    });

    it("should not need authorization", function () {
      cy.findByText("Sign In");
    });

    it("should inform the user if there are no projects", function () {
      cy.findByText("There are no projects yet.");
    });

    it("should be able to create and delete a project", function () {
      const testProject = "Test Project";

      // We should start with no projects
      cy.findByText("There are no projects yet.");
      cy.findAllByText(testProject).should("not.exist");

      cy.findByText("New Project").click();

      cy.fillSignInForm();

      cy.findByLabelText("Name").type(testProject);
      cy.findByText("Submit").click();
      cy.findByText(testProject);

      // Check home and ensure the project is present
      cy.visit("/");
      cy.findByText(testProject).click();

      // Delete the project and ensure it's gone
      cy.findByText("Delete").click();
      cy.findAllByText(testProject).should("not.exist");

      cy.request({
        url: "/project/test-page",
        failOnStatusCode: false,
      })
        .its("status")
        .should("equal", 404);
    });

    it("should be able to create projects and see them in chronological order", function () {
      cy.findByText("Sign In").click();

      cy.fillSignInForm();

      const testNames = ["c", "a", "1"].map((x) => `Project ${x}`);
      for (const testProject of testNames) {
        cy.visit("/new-project");
        cy.findByLabelText("Name").type(testProject);
        cy.findByText("Submit").click();
        cy.findByText(testProject);
      }

      cy.visit("/");
      cy.checkNamesInOrder(testNames.reverse());
    });
  });

  describe("with just enough items for the front page", function () {
    beforeEach(function () {
      cy.resetData("front-page-only");
      cy.visit("/");
    });

    it("should not display a link to the index", function () {
      const allNames = [3, 2, 1].map((x) => `Project ${x}`);

      // Homepage should have latest three projects
      cy.checkNamesInOrder(allNames);

      cy.findAllByText("More").should("not.exist");
    });
  });

  describe("with seven items", function () {
    beforeEach(function () {
      cy.resetData("two-pages");
      cy.visit("/");
    });

    it("should display the latest six projects", function () {
      const allNames = [7, 6, 5, 4, 3, 2, 1].map((x) => `Project ${x}`);

      // Homepage should have latest three projects
      cy.checkNamesInOrder(allNames.slice(0, 6));

      // First page should have all projects
      cy.findByText("More").click();
      cy.checkNamesInOrder(allNames.slice(0, 7));
    });
  });
});
