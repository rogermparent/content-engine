describe("Edit Recipe Duplicate Slug Detection", function () {
  beforeEach(function () {
    cy.resetData("two-pages");
    cy.visit("/recipe/recipe-6/edit");
    cy.fillSignInForm();
    cy.findByText("Editing Recipe: Recipe 6");
  });

  it("should show an error when changing slug to an existing recipe's slug", function () {
    cy.findByText("Advanced").click();
    cy.findByLabelText("Slug").clear({ force: true });
    cy.findByLabelText("Slug").type("recipe-5", { force: true });
    cy.findByText("Submit").click();

    cy.findByText(/already exists/i);
    cy.findByRole("button", { name: "Overwrite" });
  });

  it("should overwrite an existing recipe when clicking Overwrite", function () {
    const editedName = "Recipe 6 Renamed";
    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(editedName);

    cy.findByText("Advanced").click();
    cy.findByLabelText("Slug").clear({ force: true });
    cy.findByLabelText("Slug").type("recipe-5", { force: true });
    cy.findByText("Submit").click();

    // Wait for duplicate error to appear
    cy.findByText(/already exists/i);
    cy.findByRole("button", { name: "Overwrite" }).click();

    // Should redirect to the recipe page with the new slug
    cy.url().should("include", "/recipe/recipe-5");
    cy.findByText(editedName, { selector: "h1" });
  });

  it("should successfully edit a recipe with a unique slug (no conflict)", function () {
    cy.findByText("Advanced").click();
    cy.findByLabelText("Slug").clear({ force: true });
    cy.findByLabelText("Slug").type("recipe-6-unique", { force: true });
    cy.findByText("Submit").click();

    cy.url().should("include", "/recipe/recipe-6-unique");
    cy.findByText("Recipe 6", { selector: "h1" });
    cy.findByRole("button", { name: "Overwrite" }).should("not.exist");
  });
});
