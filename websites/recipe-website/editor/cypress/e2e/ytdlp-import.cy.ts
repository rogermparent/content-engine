describe("yt-dlp Import", function () {
  beforeEach(function () {
    cy.resetData("importable-uploads");
    cy.visit("/new-recipe");
    cy.fillSignInForm();
  });

  function configureMimic() {
    return cy
      .task<string>("resolvePath", "cypress/fixtures/yt-dlp/ytdlp-mimic.mjs")
      .then((mimicPath) => {
        cy.writeSettings({ ytdlpPath: mimicPath });
      });
  }

  it("should be able to import video data with yt-dlp", function () {
    configureMimic();

    const url = "https://www.youtube.com/watch?v=SUCCESS_TEST";
    cy.findByLabelText("Import from URL").type(url);
    cy.findByRole("button", { name: "Import" }).click();

    // Verify recipe form is populated with yt-dlp metadata
    cy.get('[name="name"]').should("have.value", "Test Recipe Video");
    cy.get('textarea[name="description"]').should(
      "contain.value",
      "Test Kitchen Channel",
    );
    cy.get('input[name="videoUrl"]').should("have.value", url);
  });

  it("should inform the user if yt-dlp has an error", function () {
    configureMimic();

    const url = "https://www.youtube.com/watch?v=ERROR_TEST";
    cy.findByLabelText("Import from URL").type(url);
    cy.findByRole("button", { name: "Import" }).click();

    cy.contains("yt-dlp error").should("be.visible");
  });

  it("should inform the user if the yt-dlp binary is not present", function () {
    cy.writeSettings({ ytdlpPath: "/nonexistent/path/to/yt-dlp" });

    const url = "https://www.youtube.com/watch?v=SUCCESS_TEST";
    cy.findByLabelText("Import from URL").type(url);
    cy.findByRole("button", { name: "Import" }).click();

    cy.contains("yt-dlp binary was not found").should("be.visible");
  });

  it("should prevent the user from submitting another request while one is currently running", function () {
    configureMimic();

    const url = "https://www.youtube.com/watch?v=SLOW_TEST";
    cy.findByLabelText("Import from URL").type(url);
    cy.findByRole("button", { name: "Import" }).click();

    // Import button should be disabled while request is pending
    cy.findByRole("button", { name: "Import" }).should("be.disabled");

    // Wait for the slow response to complete and verify the recipe loaded
    cy.get('[name="name"]', { timeout: 15000 }).should(
      "have.value",
      "Slow Recipe Video",
    );

    // Import button should be enabled again
    cy.findByRole("button", { name: "Import" }).should("be.enabled");
  });
});
