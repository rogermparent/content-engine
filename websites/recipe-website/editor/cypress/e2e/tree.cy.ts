describe("Index Page", function () {
  describe("with linked recipes", function () {
    beforeEach(function () {
      cy.resetData("linked-recipes");
    });

    it("should display a tree", function () {
      cy.visit("/");
      cy.findByText("Baked Potatoes").should("exist");
    });
  });
});
