describe("Yield Feature", function () {
  beforeEach(function () {
    cy.resetData("importable-uploads");
    cy.visit("/new-recipe");
  });

  describe("when authenticated", function () {
    beforeEach(function () {
      cy.fillSignInForm();
    });

    it("should be able to set a yield with multiplyable number", function () {
      const newRecipeTitle = "Recipe with Yield";
      const yieldValue = '<Multiplyable baseNumber="12" /> cookies';

      cy.findAllByLabelText("Name").first().clear();
      cy.findAllByLabelText("Name").first().type(newRecipeTitle);

      // Verify Yield input exists and type value
      cy.findByLabelText("Yield").type(yieldValue);

      cy.findByText("Submit").click();

      cy.findByRole("heading", { name: newRecipeTitle });

      // Verify Yield is displayed
      cy.findByText("Yield").parent("div").findByText("12 cookies");

      // Verify multiplier works
      cy.findByLabelText("Multiply").clear().type("2");
      cy.findByText("Yield").parent("div").findByText("24 cookies");

      // Verify multiplier with fraction
      cy.findByLabelText("Multiply").clear().type("0.5");
      cy.findByText("Yield").parent("div").findByText("6 cookies");
    });

    it("should allow using the Multiplyable button in Yield input", function () {
      const newRecipeTitle = "Recipe with Yield Button";

      cy.findAllByLabelText("Name").first().clear();
      cy.findAllByLabelText("Name").first().type(newRecipeTitle);

      // Type "12 cookies", select "12", click multiplyable button
      cy.findByLabelText("Yield").clear().type("12 cookies");

      // Select "12" (first 2 characters)
      cy.findByLabelText("Yield").then(($input) => {
        const input = $input[0] as HTMLInputElement;
        input.setSelectionRange(0, 2);
      });

      // Click the multiplyable button
      cy.findByLabelText("Yield")
        .parent()
        .parent()
        .within(() => {
          cy.findByText("×").click();
        });

      cy.findByLabelText("Yield").should(
        "have.value",
        '<Multiplyable baseNumber="12" /> cookies',
      );
    });
  });
});
