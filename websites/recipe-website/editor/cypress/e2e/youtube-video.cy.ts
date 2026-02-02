describe("YouTube Video Support", function () {
  describe("with the importable uploads fixture", function () {
    beforeEach(function () {
      cy.resetData("importable-uploads");
      cy.visit("/new-recipe");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("imports recipe with YouTube video from JSON-LD", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/youtube-recipe.html";
        const fullTestURL = new URL(testURL, baseURL);

        // Import from URL
        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();

        // Wait for import to complete by checking if name is populated
        cy.get('[name="name"]').should("have.value", "YouTube Recipe Example");

        // Verify URL mode is selected
        cy.findByLabelText("Enter URL").should("be.checked");

        // Verify video URL is populated
        cy.get('input[name="videoUrl"]').should(
          "have.value",
          "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        );

        // Submit form
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect to recipe page
        cy.url().should("match", /\/recipe\/[^/]+$/);

        // Verify YouTube player embeds
        cy.get("youtube-video")
          .shadow()
          .find("iframe")
          .invoke("attr", "src")
          .should("match", /https:\/\/www.youtube.com\/embed\/jNQXAC9IVRw/);
      });

      it("allows manual YouTube URL entry", function () {
        // Fill required fields
        cy.findByLabelText("Name").type("YouTube Recipe Test");

        // Select URL mode
        cy.findByLabelText("Enter URL").check();

        // Enter YouTube URL
        cy.findByLabelText("Video URL")
          .type("https://www.youtube.com/watch?v=jNQXAC9IVRw")
          .blur();

        // Verify preview appears
        cy.get("youtube-video").should("exist");

        // Submit and verify
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect
        cy.url().should("match", /\/recipe\/[^/]+$/);

        // Verify video plays on recipe page
        cy.get("youtube-video")
          .shadow()
          .find("iframe")
          .invoke("attr", "src")
          .should("match", /https:\/\/www.youtube.com\/embed\/jNQXAC9IVRw/);
      });

      it("supports various video platform URLs", function () {
        cy.findByLabelText("Name").type("Multi-Platform Test");
        cy.findByLabelText("Enter URL").check();

        // Test YouTube
        cy.findByLabelText("Video URL")
          .type("https://www.youtube.com/watch?v=jNQXAC9IVRw")
          .blur();
        cy.get("youtube-video").should("exist");

        // Test Vimeo (clear and enter new URL)
        cy.findByLabelText("Video URL")
          .clear()
          .type("https://vimeo.com/347119375")
          .blur();
        cy.get("vimeo-video").should("exist");

        // Submit with Vimeo URL
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect
        cy.url().should("match", /\/recipe\/[^/]+$/);

        // Verify Vimeo player embeds
        cy.get("vimeo-video")
          .shadow()
          .find("iframe")
          .invoke("attr", "src")
          .should("match", /https:\/\/player.vimeo.com\/video\/347119375/);
      });

      it("shows error for invalid URL", function () {
        cy.findByLabelText("Name").type("Invalid URL Test");
        cy.findByLabelText("Enter URL").check();

        // Enter invalid URL
        cy.findByLabelText("Video URL").type("not-a-url").blur();

        // Check for error message
        cy.contains("Invalid URL format").should("exist");
      });

      it("switches between file and URL modes", function () {
        cy.findByLabelText("Name").type("Mode Switch Test");

        // Start with URL mode
        cy.findByLabelText("Enter URL").check();
        cy.findByLabelText("Video URL")
          .type("https://www.youtube.com/watch?v=jNQXAC9IVRw")
          .blur();
        cy.get("youtube-video").should("exist");

        // Switch to file mode
        cy.findByLabelText("Upload File").check();
        cy.get("youtube-video").should("not.exist");
        cy.findByLabelText("Video URL").should("not.exist");

        // Switch back to URL mode
        cy.findByLabelText("Enter URL").check();
        // URL should be cleared after mode switch
        cy.get('input[name="videoUrl"]').should("have.value", "");
      });

      it("edits recipe with YouTube video", function () {
        // Create recipe with YouTube video
        cy.findByLabelText("Name").type("Edit YouTube Test");
        cy.findByLabelText("Enter URL").check();
        cy.findByLabelText("Video URL")
          .type("https://www.youtube.com/watch?v=jNQXAC9IVRw")
          .blur();
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect
        cy.url().should("match", /\/recipe\/[^/]+$/);
        cy.get("youtube-video")
          .shadow()
          .find("iframe")
          .invoke("attr", "src")
          .should("match", /https:\/\/www.youtube.com\/embed\/jNQXAC9IVRw/);

        // Navigate to edit page
        cy.findByRole("link", { name: "Edit" }).click();

        // Verify URL mode is selected and URL is populated
        cy.findByLabelText("Enter URL").should("be.checked");
        cy.get('input[name="videoUrl"]').should(
          "have.value",
          "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        );

        // Change URL
        cy.findByLabelText("Video URL")
          .clear()
          .type("https://www.youtube.com/watch?v=wiCEyvooYYI")
          .blur();

        // Submit
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect
        cy.url().should("match", /\/recipe\/[^/]+$/);

        // Verify new URL (check iframe src contains the new video ID)
        cy.get("youtube-video")
          .shadow()
          .find("iframe")
          .invoke("attr", "src")
          .should("match", /https:\/\/www.youtube.com\/embed\/wiCEyvooYYI/);
      });

      it("preserves existing file upload when editing", function () {
        // Create recipe with file upload
        cy.findByLabelText("Name").type("File Upload Test");
        cy.findByLabelText("Upload File").should("be.checked");

        // Submit without video
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect
        cy.url().should("match", /\/recipe\/[^/]+$/);

        // Navigate to edit page
        cy.findByRole("link", { name: "Edit" }).click();

        // File mode should be selected by default
        cy.findByLabelText("Upload File").should("be.checked");
      });

      it("clears video when switching from URL to file mode and back", function () {
        cy.findByLabelText("Name").type("Clear Video Test");

        // Enter URL
        cy.findByLabelText("Enter URL").check();
        cy.findByLabelText("Video URL")
          .type("https://www.youtube.com/watch?v=test123")
          .blur();

        // Switch to file mode (should clear URL)
        cy.findByLabelText("Upload File").check();

        // Switch back to URL mode
        cy.findByLabelText("Enter URL").check();

        // URL should be empty
        cy.get('input[name="videoUrl"]').should("have.value", "");
      });

      it("handles YouTube short URLs", function () {
        cy.findByLabelText("Name").type("YouTube Short URL Test");
        cy.findByLabelText("Enter URL").check();

        // Enter YouTube short URL
        cy.findByLabelText("Video URL")
          .type("https://youtu.be/jNQXAC9IVRw")
          .blur();

        // react-player should handle short URLs
        cy.get("youtube-video").should("exist");

        // Submit
        cy.findByRole("button", { name: "Submit" }).click();

        // Wait for redirect
        cy.url().should("match", /\/recipe\/[^/]+$/);

        // Verify video embeds
        cy.get("youtube-video")
          .shadow()
          .find("iframe")
          .invoke("attr", "src")
          .should("match", /https:\/\/www.youtube.com\/embed\/jNQXAC9IVRw/);
      });
    });
  });
});
