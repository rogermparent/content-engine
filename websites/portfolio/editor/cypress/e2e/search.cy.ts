describe("Search Page", () => {
  describe("with seven items", () => {
    beforeEach(() => {
      cy.resetData("two-pages");
      cy.visit("/search");
    });

    it("should not need authorization", () => {
      cy.findByText("Sign In");
    });

    it("should be able to find a single project by name", () => {
      cy.findByLabelText("Query").type("Project 6");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("listitem")
        .findByRole("heading")
        .should("have.text", "Project 6");

      cy.findByLabelText("Query").clear();
      cy.findByLabelText("Query").type("6 Project");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("listitem")
        .findByRole("heading")
        .should("have.text", "Project 6");

      cy.findByLabelText("Query").clear();
      cy.findByLabelText("Query").type("project 6");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("listitem")
        .findByRole("heading")
        .should("have.text", "Project 6");

      cy.findByLabelText("Query").clear();
      cy.findByLabelText("Query").type("6");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("listitem")
        .findByRole("heading")
        .should("have.text", "Project 6");

      cy.findByLabelText("Query").clear();
      cy.findByLabelText("Query").type("5");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("listitem")
        .findByRole("heading")
        .should("have.text", "Project 5");
    });

    it("should be able to find a project by ingredient", () => {
      cy.findByLabelText("Query").type("sal");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("heading", { name: "Project 6" });

      cy.findByText(/^1 1\/2 tsp.*t$/).findByText("sal");
    });
  });
});
