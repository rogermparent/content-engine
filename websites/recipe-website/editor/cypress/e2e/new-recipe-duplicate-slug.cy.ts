describe("New Recipe Duplicate Slug Detection", function () {
  beforeEach(function () {
    cy.resetData("one-recipe");
    cy.visit("/new-recipe");
    cy.fillSignInForm();
  });

  it("should show an error when submitting a recipe with a duplicate slug (auto-generated)", function () {
    // "Existing Recipe" auto-generates slug "existing-recipe" which already exists
    cy.get('[name="name"]').type("Existing Recipe");
    cy.findByText("Submit").click();

    cy.findByText(/already exists/i);
    cy.findByRole("button", { name: "Overwrite" });
  });

  it("should show an error when submitting a recipe with a manually entered duplicate slug", function () {
    cy.get('[name="name"]').type("Something Different");
    cy.findByText("Advanced").click();
    cy.findByLabelText("Slug").clear({ force: true });
    cy.findByLabelText("Slug").type("existing-recipe", { force: true });
    cy.findByText("Submit").click();

    cy.findByText(/already exists/i);
    cy.findByRole("button", { name: "Overwrite" });
  });

  it("should overwrite an existing recipe when clicking Overwrite", function () {
    cy.get('[name="name"]').type("Existing Recipe");
    cy.findByText("Submit").click();

    // Wait for duplicate error to appear
    cy.findByText(/already exists/i);
    cy.findByRole("button", { name: "Overwrite" }).click();

    // Should redirect to the recipe page
    cy.url().should("include", "/recipe/existing-recipe");
    cy.findByText("Existing Recipe", { selector: "h1" });
  });

  it("should successfully create a recipe with a unique slug (no error)", function () {
    cy.get('[name="name"]').type("Brand New Recipe");
    cy.findByText("Submit").click();

    cy.url().should("include", "/recipe/brand-new-recipe");
    cy.findByText("Brand New Recipe", { selector: "h1" });
    cy.findByRole("button", { name: "Overwrite" }).should("not.exist");
  });
});
