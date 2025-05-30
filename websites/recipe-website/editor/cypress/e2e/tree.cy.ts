describe("Index Page", function () {
  describe("with linked recipes", function () {
    beforeEach(function () {
      cy.resetData("linked-recipes");
      cy.visit("/tree");
    });

    it("should display a tree", function () {
      cy.findByText("Baked Potatoes").should("exist");
    });
  });
});
