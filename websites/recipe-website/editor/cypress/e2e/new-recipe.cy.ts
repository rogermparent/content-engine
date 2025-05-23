describe("New Recipe View", function () {
  describe("with the importable uploads fixture", function () {
    beforeEach(function () {
      cy.resetData("importable-uploads");
      cy.visit("/new-recipe");
    });

    it("should need authentication", function () {
      cy.findByText("Sign in with Credentials");
    });

    describe("when authenticated", function () {
      beforeEach(function () {
        cy.fillSignInForm();
      });

      it("should resize the image in an imported recipe", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/blackstone-nachos.html";
        const fullTestURL = new URL(testURL, baseURL);
        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();
        cy.url().should(
          "equal",
          new URL(
            "/new-recipe?import=http%3A%2F%2Flocalhost%3A3000%2Fuploads%2Fblackstone-nachos.html",
            baseURL,
          ).href,
        );

        cy.findByText("Submit").click();

        // Ensure we're on the view page and not the new-recipe page
        cy.findByLabelText("Multiply", { timeout: 10000 });

        // Check if the image is resized correctly
        cy.findByRole("img").should(($img) => {
          const img = $img[0] as HTMLImageElement;
          expect(img.src).to.eq(
            new URL(
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w3840q75.webp",
              baseURL,
            ).href,
          );
          expect(img.srcset).to.eq(
            [
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w640q75.webp 640w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w750q75.webp 750w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w828q75.webp 828w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w1080q75.webp 1080w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w1200q75.webp 1200w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w1920q75.webp 1920w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w2048q75.webp 2048w",
              "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w3840q75.webp 3840w",
            ].join(", "),
          );
        });
      });

      it("should be able to add a new ingredient", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Ingredient";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Ingredient").click();

        cy.get('[name="ingredients[0].ingredient"]').type("1 cup of water");

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        cy.findByText("1 cup of water");
      });

      it("should be able to add a new ingredient heading", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Ingredient";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Ingredient").click();

        cy.findByText("Ingredient").click();

        cy.get('[name="ingredients[0].ingredient"]').type(
          "My Ingredient Heading",
        );

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        cy.findByText("My Ingredient Heading");
      });

      it("should not create a recipe with an empty ingredient", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Ingredient";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Ingredient").click();

        cy.get('[name="ingredients[0].ingredient"]').should("exist");

        cy.findByText("Submit").click();

        cy.findByText("Error parsing recipe");
        cy.findByRole("heading", { name: newRecipeTitle }).should("not.exist");
      });

      it("should be able to add a new instruction", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Instruction";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Instruction").click();

        cy.get('[name="instructions[0].name"]').type("Instruction 1");
        cy.get('[name="instructions[0].text"]').type(
          "This is the first instruction",
        );

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        cy.findByText("Instruction 1");
        cy.findByText("This is the first instruction");
      });

      it("should be able to add a new instruction group", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Instruction";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Instruction").click();

        cy.findByText("☰").click();
        cy.get('[name="instructions[0].name"]').type("Instruction Group 1");

        cy.findAllByText("Add Instruction").should("have.length", 2);
        cy.findAllByText("Add Instruction").first().click();

        cy.get('[name="instructions[0].instructions[0].name"]').type(
          "Child Instruction 1",
        );
        cy.get('[name="instructions[0].instructions[0].text"]').type(
          "This is the first instruction",
        );

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        cy.findByText("Instruction Group 1")
          .parent("li")
          .within(() => {
            cy.findByText("Child Instruction 1");
            cy.findByText("This is the first instruction");
          });
      });

      it("should not create a recipe with an empty instruction", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Instruction";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Instruction").click();

        cy.get('[name="instructions[0].name"]').should("exist");
        cy.get('[name="instructions[0].text"]').should("exist");

        cy.findByText("Submit").click();

        cy.findByText("Error parsing recipe");
        cy.findByRole("heading", { name: newRecipeTitle }).should("not.exist");
      });

      it("should not create an instruction group without a name", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Instruction";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Add Instruction").click();

        cy.findByText("☰").click();

        cy.findAllByText("Add Instruction").should("have.length", 2);
        cy.findAllByText("Add Instruction").first().click();

        cy.get('[name="instructions[0].instructions[0].name"]').type(
          "Child Instruction 1",
        );
        cy.get('[name="instructions[0].instructions[0].text"]').type(
          "This is the first instruction",
        );

        cy.findByText("Submit").click();

        cy.findByText("Error parsing recipe");
        cy.findByRole("heading", { name: newRecipeTitle }).should("not.exist");
      });

      it("should be able to add a new recipe with a video", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe with Video";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        // Upload a video file
        cy.findByLabelText("Video").selectFile({
          contents: "cypress/fixtures/videos/sample-video.mp4",
          fileName: "sample-video.mp4",
          mimeType: "video/mp4",
        });

        // Verify that the video preview is displayed
        cy.get("video")
          .should("have.attr", "src")
          .should("match", /^blob:/);

        // Add instruction with VideoTime component
        cy.findByText("Paste Instructions").click();
        cy.findByTitle("Instructions Paste Area").type(
          `Do the first step like <VideoTime time={{}10{}}>10s</VideoTime>`,
        );

        cy.findByText("Import Instructions").click();

        cy.findByText("Submit").click();

        // Verify that the recipe view page displays the video
        cy.findByRole("heading", { name: newRecipeTitle });
        cy.get("video").should("exist");

        // TODO: Test VideoTime component's timestamp link
      });

      it("should be able to create a new recipe", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        cy.visit("/");

        cy.findByText(newRecipeTitle);

        cy.checkNamesInOrder([newRecipeTitle]);
      });

      it("should trim pasted instructions", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Paste Instructions").click();
        cy.findByTitle("Instructions Paste Area").type(
          `
1. Do the first step
    2. Do the second step with whitespace
Have no number on three


        4. Have whitespace at the beginning and end
`,
        );

        cy.findByText("Import Instructions").click();

        // Verify trimmed instruction text in form
        cy.get('[name="instructions[0].text"]').should(
          "have.value",
          `Do the first step`,
        );

        cy.get('[name="instructions[1].text"]').should(
          "have.value",
          `Do the second step with whitespace`,
        );

        cy.get('[name="instructions[2].text"]').should(
          "have.value",
          `Have no number on three`,
        );

        cy.get('[name="instructions[3].text"]').should(
          "have.value",
          `Have whitespace at the beginning and end`,
        );

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        // Verify trimmed instruction text on view
        cy.findByText(`Do the first step`);

        cy.findByText(`Do the second step with whitespace`);

        cy.findByText(`Have no number on three`);

        cy.findByText(`Have whitespace at the beginning and end`);
      });

      it("should be able to paste ingredients with different bullet styles", function () {
        cy.findByRole("heading", { name: "New Recipe" });

        const newRecipeTitle = "My New Recipe";

        cy.findAllByLabelText("Name").first().clear();
        cy.findAllByLabelText("Name").first().type(newRecipeTitle);

        cy.findByText("Paste Ingredients").click();
        cy.findByTitle("Ingredients Paste Area").type(
          `
 * 1 cup water ((for the dashi packet))
 - 1 dashi packet
 • 2 tsp sugar
 ▪ 2 Tbsp mirin
* 2 Tbsp soy sauce
- ½ onion ((4 oz 113 g))
• 1 green onion/scallion ((for garnish))
▪ 3 large eggs (50 g each w/o shell)
       2 tonkatsu
 - - 2 servings cooked Japanese short-grain rice ((typically 1⅔ cups (250 g) per donburi serving))
`,
        );

        cy.findByText("Import Ingredients").click();

        // Verify first ingredient
        cy.get('[name="ingredients[0].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="1" /> cup water ((for the dashi packet))`,
        );

        // Verify vulgar fraction ingredient
        cy.get('[name="ingredients[5].ingredient"]').should(
          "have.value",
          `<Multiplyable baseNumber="1/2" /> onion ((<Multiplyable baseNumber="4" /> oz <Multiplyable baseNumber="113" /> g))`,
        );

        cy.findByText("Submit").click();

        cy.findByRole("heading", { name: newRecipeTitle });

        cy.findByText("1 cup water ((for the dashi packet))");
        cy.findByText("1 dashi packet");
        cy.findByText("2 tsp sugar");
        cy.findByText("2 Tbsp mirin");
        cy.findByText("2 Tbsp soy sauce");
        cy.findByText("1/2 onion ((4 oz 113 g))");
        cy.findByText("1 green onion/scallion ((for garnish))");
        cy.findByText("3 large eggs (50 g each w/o shell)");
        cy.findByText("2 tonkatsu");
        cy.findByText(
          "2 servings cooked Japanese short-grain rice ((typically 4 cups (250 g) per donburi serving))",
        );
      });

      it("should be able to import a recipe", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/katsudon.html";
        const fullTestURL = new URL(testURL, baseURL);
        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();
        cy.url().should(
          "equal",
          new URL(
            "/new-recipe?import=http%3A%2F%2Flocalhost%3A3000%2Fuploads%2Fkatsudon.html",
            baseURL,
          ).href,
        );

        // Stay within the recipe form to minimize matching outside
        cy.get("#recipe-form").within(() => {
          // Verify top-level fields, i.e. name and description
          cy.get('[name="name"]').should("have.value", "Katsudon");
          cy.get('[name="description"]').should(
            "have.value",
            "*Imported from [http://localhost:3000/uploads/katsudon.html](http://localhost:3000/uploads/katsudon.html)*\n\n---\n\nKatsudon is a Japanese pork cutlet rice bowl made with tonkatsu, eggs, and sautéed onions simmered in a sweet and savory sauce. It‘s a one-bowl wonder and true comfort food!",
          );

          // Verify first ingredient
          cy.get('[name="ingredients[0].ingredient"]').should(
            "have.value",
            `<Multiplyable baseNumber="1" /> cup water ((for the dashi packet))`,
          );

          // Verify vulgar fraction ingredient
          cy.get('[name="ingredients[5].ingredient"]').should(
            "have.value",
            `<Multiplyable baseNumber="1/2" /> onion ((<Multiplyable baseNumber="4" /> oz, <Multiplyable baseNumber="113" /> g))`,
          );

          // Verify first instruction, which is a simple step
          cy.get('[name="instructions[0].name"]').should("have.value", "");
          cy.get('[name="instructions[0].text"]').should(
            "have.value",
            "Before You Start: Gather all the ingredients. For the steamed rice, please note that 1½ cups (300 g, 2 rice cooker cups) of uncooked Japanese short-grain rice yield 4⅓ cups (660 g) of cooked rice, enough for 2 donburi servings (3⅓ cups, 500 g). See how to cook short-grain rice with a rice cooker, pot over the stove, Instant Pot, or donabe.",
          );

          // Verify second instruction, which is a group
          cy.get('[name="instructions[1].name"]').should(
            "have.value",
            "To Make the Dashi",
          );
          cy.get('[name="instructions[1].text"]').should("not.exist");
        });
      });

      it("should trim hash from imported URL", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/katsudon.html#section1";
        const fullTestURL = new URL(testURL, baseURL);

        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();

        // Verify the URL in the address bar has the hash but the import works with trimmed URL
        cy.url().should(
          "equal",
          new URL(
            `/new-recipe?import=${encodeURIComponent(fullTestURL.href)}`,
            baseURL,
          ).href,
        );

        // Stay within the recipe form to verify the import worked
        cy.get("#recipe-form").within(() => {
          // Verify the recipe was imported correctly despite the hash
          cy.get('[name="name"]').should("have.value", "Katsudon");
          cy.get('[name="description"]').should(
            "have.value",
            "*Imported from [http://localhost:3000/uploads/katsudon.html](http://localhost:3000/uploads/katsudon.html)*\n\n---\n\nKatsudon is a Japanese pork cutlet rice bowl made with tonkatsu, eggs, and sautéed onions simmered in a sweet and savory sauce. It‘s a one-bowl wonder and true comfort food!",
          );

          // Verify first ingredient was imported
          cy.get('[name="ingredients[0].ingredient"]').should(
            "have.value",
            `<Multiplyable baseNumber="1" /> cup water ((for the dashi packet))`,
          );
        });

        // Submit the recipe
        cy.findByText("Submit").click();

        // Verify we're on the view page
        cy.findByLabelText("Multiply", { timeout: 10000 });

        // Verify the recipe was created successfully
        cy.findByRole("heading", { name: "Katsudon" });
        cy.findByText("1 cup water ((for the dashi packet))");
      });

      it("should be able to import a recipe with an image with GET params", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/blackstone-nachos-with-params.html";
        const fullTestURL = new URL(testURL, baseURL);
        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();
        cy.url().should(
          "equal",
          new URL(
            `/new-recipe?import=${encodeURIComponent(fullTestURL.href)}`,
            baseURL,
          ).href,
        );

        // Stay within the recipe form to minimize matching outside
        cy.get("#recipe-form").within(() => {
          // Verify top-level fields, i.e. name and description
          cy.get('[name="name"]').should(
            "have.value",
            "Blackstone Griddle Grilled Nachos",
          );
          cy.get('[name="description"]').should(
            "have.value",
            "*Imported from [http://localhost:3000/uploads/blackstone-nachos-with-params.html](http://localhost:3000/uploads/blackstone-nachos-with-params.html)*\n\n---\n\nWho doesn’t love nachos? Jazz up your nacho routine with these super-tasty Blackstone Nachos Supreme. Made effortlessly on your Blackstone Griddle, there’s nothing like this towering pile of crispy chips and delish toppings for your next snack attack.",
          );

          // Verify first ingredient
          cy.get('[name="ingredients[0].ingredient"]').should(
            "have.value",
            `Olive Oil <Multiplyable baseNumber="1" /> tablespoon`,
          );

          // Verify last ingredient
          cy.get('[name="ingredients[9].ingredient"]').should(
            "have.value",
            `Lettuce, Shredded <Multiplyable baseNumber="1/2" /> cup`,
          );

          // Verify empty string ingredient from import was ignored
          cy.get('[name="ingredients[10].ingredient"]').should("not.exist");

          // Verify first instruction
          cy.get('[name="instructions[0].name"]').should("have.value", "");
          cy.get('[name="instructions[0].text"]').should(
            "have.value",
            "Preheat the Blackstone Flat Top Griddle to medium heat.",
          );

          // Image preview should be external link to image we will import
          cy.findByRole("img").should(
            "have.attr",
            "src",
            new URL(
              "/uploads/recipe-imported-image-566x566.png?param=value",
              baseURL,
            ).href,
          );
        });

        cy.findByText("Submit").click();

        // Ensure we're on the view page and not the new-recipe page
        cy.findByLabelText("Multiply", { timeout: 10000 });

        // Image should be newly created from the import's source
        const processedImagePath =
          "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w3840q75.webp";

        cy.findByRole("img").should("have.attr", "src", processedImagePath);

        cy.request({
          url: processedImagePath,
        })
          .its("status")
          .should("equal", 200);

        // Ensure resulting edit page works

        cy.findByText("Edit").click();

        cy.findByText("Editing Recipe: Blackstone Griddle Grilled Nachos");

        cy.findByRole("img").should("have.attr", "src", processedImagePath);
      });

      it("should be able to import a recipe with an image", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/blackstone-nachos.html";
        const fullTestURL = new URL(testURL, baseURL);
        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();
        cy.url().should(
          "equal",
          new URL(
            "/new-recipe?import=http%3A%2F%2Flocalhost%3A3000%2Fuploads%2Fblackstone-nachos.html",
            baseURL,
          ).href,
        );

        // Stay within the recipe form to minimize matching outside
        cy.get("#recipe-form").within(() => {
          // Verify top-level fields, i.e. name and description
          cy.get('[name="name"]').should(
            "have.value",
            "Blackstone Griddle Grilled Nachos",
          );
          cy.get('[name="description"]').should(
            "have.value",
            "*Imported from [http://localhost:3000/uploads/blackstone-nachos.html](http://localhost:3000/uploads/blackstone-nachos.html)*\n\n---\n\nWho doesn’t love nachos? Jazz up your nacho routine with these super-tasty Blackstone Nachos Supreme. Made effortlessly on your Blackstone Griddle, there’s nothing like this towering pile of crispy chips and delish toppings for your next snack attack.",
          );

          // Verify first ingredient
          cy.get('[name="ingredients[0].ingredient"]').should(
            "have.value",
            `Olive Oil <Multiplyable baseNumber="1" /> tablespoon`,
          );

          // Verify last ingredient
          cy.get('[name="ingredients[9].ingredient"]').should(
            "have.value",
            `Lettuce, Shredded <Multiplyable baseNumber="1/2" /> cup`,
          );

          // Verify empty string ingredient from import was ignored
          cy.get('[name="ingredients[10].ingredient"]').should("not.exist");

          // Verify first instruction
          cy.get('[name="instructions[0].name"]').should("have.value", "");
          cy.get('[name="instructions[0].text"]').should(
            "have.value",
            "Preheat the Blackstone Flat Top Griddle to medium heat.",
          );

          // Image preview should be external link to image we will import
          cy.findByRole("img").should(
            "have.attr",
            "src",
            new URL("/uploads/recipe-imported-image-566x566.png", baseURL).href,
          );
        });

        cy.findByText("Submit").click();

        // Ensure we're on the view page and not the new-recipe page
        cy.findByLabelText("Multiply", { timeout: 10000 });

        // Image should be newly created from the import's source
        const processedImagePath =
          "/image/uploads/recipe/blackstone-griddle-grilled-nachos/uploads/recipe-imported-image-566x566.png/recipe-imported-image-566x566-w3840q75.webp";

        cy.findByRole("img").should("have.attr", "src", processedImagePath);

        cy.request({
          url: processedImagePath,
        })
          .its("status")
          .should("equal", 200);

        // Ensure resulting edit page works

        cy.findByText("Edit").click();

        cy.findByText("Editing Recipe: Blackstone Griddle Grilled Nachos");

        cy.findByRole("img").should("have.attr", "src", processedImagePath);
      });

      it("should be able to import a recipe with a singular image", function () {
        const baseURL = Cypress.config().baseUrl;
        const testURL = "/uploads/pork-carnitas.html";
        const fullTestURL = new URL(testURL, baseURL);
        cy.findByLabelText("Import from URL").type(fullTestURL.href);
        cy.findByRole("button", { name: "Import" }).click();
        cy.url().should(
          "equal",
          new URL(
            "/new-recipe?import=http%3A%2F%2Flocalhost%3A3000%2Fuploads%2Fpork-carnitas.html",
            baseURL,
          ).href,
        );

        // Stay within the recipe form to minimize matching outside
        cy.get("#recipe-form").within(() => {
          // Verify top-level fields, i.e. name and description
          cy.get('[name="name"]').should("have.value", "Pork Carnitas");
          cy.get('[name="description"]').should(
            "have.value",
            `*Imported from [http://localhost:3000/uploads/pork-carnitas.html](http://localhost:3000/uploads/pork-carnitas.html)*

---

Carnitas, or Mexican pulled pork, is made by slow cooking pork until perfectly tender and juicy, then roasting the shredded pork for deliciously crisp edges.`,
          );

          // Verify first ingredient
          cy.get('[name="ingredients[0].ingredient"]').should(
            "have.value",
            `<Multiplyable baseNumber="0.25" /> cup vegetable oil`,
          );

          // Verify last ingredient
          cy.get('[name="ingredients[9].ingredient"]').should(
            "have.value",
            `<Multiplyable baseNumber="4" /> (<Multiplyable baseNumber="14.5" /> ounce) cans chicken broth`,
          );

          // Verify empty string ingredient from import was ignored
          cy.get('[name="ingredients[10].ingredient"]').should("not.exist");

          // Verify first instruction
          cy.get('[name="instructions[0].name"]').should("have.value", "");
          cy.get('[name="instructions[0].text"]').should(
            "have.value",
            "Gather all ingredients.",
          );

          // Image preview should be external link to image we will import
          cy.findByRole("img").should(
            "have.attr",
            "src",
            new URL("/uploads/pork-carnitas.webp", baseURL).href,
          );
        });

        cy.findByText("Submit").click();

        // Ensure we're on the view page and not the new-recipe page
        cy.findByLabelText("Multiply");

        // Image should be newly created from the import's source
        const processedImagePath =
          "/image/uploads/recipe/pork-carnitas/uploads/pork-carnitas.webp/pork-carnitas-w3840q75.webp";

        cy.findByRole("img").should("have.attr", "src", processedImagePath);

        cy.request({
          url: processedImagePath,
        })
          .its("status")
          .should("equal", 200);

        // Ensure resulting edit page works

        cy.findByText("Edit").click();

        cy.findByText("Editing Recipe: Pork Carnitas");

        cy.findByRole("img").should("have.attr", "src", processedImagePath);
      });
    });
  });
});
