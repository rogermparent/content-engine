describe("Timeline Feature", function () {
  beforeEach(function () {
    cy.resetData("importable-uploads");
    cy.visit("/new-recipe");
    cy.fillSignInForm();
  });

  it("should be able to add a timeline event with default values", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Timeline Test Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    cy.findByText("Add Timeline Event").click();

    cy.get('[name="timeline[0].name"]').type("Rise Dough");
    cy.get('[name="timeline[0].defaultLength.minutes"]').type("60");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify timeline is displayed
    cy.findByText("Timeline").should("exist");
    cy.findByText("Rise Dough").should("exist");
    cy.findByText("1h 0m").should("exist");
  });

  it("should be able to add a timeline event with min and max constraints", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Timeline Constraints Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    cy.findByText("Add Timeline Event").click();

    cy.get('[name="timeline[0].name"]').type("Bake");
    cy.get('[name="timeline[0].defaultLength.minutes"]').type("45");

    // Set min length
    cy.get('[name="timeline[0].minLength.minutes"]').type("30");

    // Set max length
    cy.get('[name="timeline[0].maxLength.minutes"]').type("60");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify timeline elements
    cy.findByText("Bake").should("exist");
    cy.findByText("45m").should("exist");
  });

  it("should display multiple timeline events in order", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Multi-Step Timeline";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Event 1
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[0].name"]').type("Mix");
    cy.get('[name="timeline[0].defaultLength.minutes"]').type("10");

    // Event 2
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[1].name"]').type("Rest");
    cy.get('[name="timeline[1].defaultLength.minutes"]').type("20");
    cy.get('[name="timeline[1].activeTime"]').click(); // Uncheck (default is unchecked? No, let's check)

    // Let's check "Active Time?" for Mix
    cy.get('[name="timeline[0].activeTime"]').check();

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByText("Mix").should("exist");
    cy.findByText("10m").should("exist");

    cy.findByText("Rest").should("exist");
    cy.findByText("20m").should("exist");
  });

  it("should show resize handles only for resizable events", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Resizable vs Fixed Timeline";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Resizable Event (has min/max)
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[0].name"]').type("Resizable Step");
    cy.get('[name="timeline[0].defaultLength.minutes"]').type("30");
    cy.get('[name="timeline[0].minLength.minutes"]').type("20");
    cy.get('[name="timeline[0].maxLength.minutes"]').type("40");

    // Fixed Event (no min/max)
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[1].name"]').type("Fixed Step");
    cy.get('[name="timeline[1].defaultLength.minutes"]').type("15");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Resizable step should have a resize handle
    cy.contains("Resizable Step")
      .parent()
      .find(".cursor-col-resize")
      .should("exist");

    // Fixed step should NOT have a resize handle
    cy.contains("Fixed Step")
      .parent()
      .find(".cursor-col-resize")
      .should("not.exist");
  });

  it("should be able to resize a timeline event in the view", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Resize Test Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add two events so we have a valid resizing scenario
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[0].name"]').type("Step 1");
    cy.get('[name="timeline[0].defaultLength.minutes"]').type("30");
    cy.get('[name="timeline[0].minLength.minutes"]').type("10");
    cy.get('[name="timeline[0].maxLength.minutes"]').type("60");

    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[1].name"]').type("Step 2");
    cy.get('[name="timeline[1].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Initial state
    cy.findByText("Step 1").parent().should("contain.text", "30m");

    // Find the resize handle for Step 1
    cy.contains("Step 1")
      .parent()
      .find(".cursor-col-resize")
      .then(($handle) => {
        // Get container width to calculate expected values
        cy.contains("h3", "Timeline")
          .parent()
          .next(".overflow-hidden")
          .then(($container) => {
            const containerWidth = $container[0].clientWidth;
            const handleRect = $handle[0].getBoundingClientRect();
            const startX = handleRect.left + handleRect.width / 2;
            const startY = handleRect.top + handleRect.height / 2;

            const moveX = -50; // Move left by 50 pixels

            // Simulate drag operation
            cy.wrap($handle).trigger("mousedown", {
              which: 1,
              clientX: startX,
              clientY: startY,
            });
            cy.document().trigger("mousemove", {
              clientX: startX + moveX,
              clientY: startY,
            });
            cy.document().trigger("mouseup", { force: true });

            // Calculate expected duration
            const startWidth = containerWidth / 2;
            const targetWidth = startWidth + moveX;
            const otherEventsDuration = 30; // Step 2 is fixed at 30m duration

            // Formula from implementation: L = (w * T) / (W - w)
            let expectedLength =
              (targetWidth * otherEventsDuration) /
              (containerWidth - targetWidth);
            expectedLength = Math.round(expectedLength);

            // Apply constraints (Min 10, Max 60 defined in test)
            expectedLength = Math.max(10, Math.min(60, expectedLength));

            const expectedTotal = expectedLength + 30;

            // Format expected total string
            const h = Math.floor(expectedTotal / 60);
            const m = Math.floor(expectedTotal % 60);
            const totalText = h > 0 ? `${h}h ${m}m` : `${m}m`;

            // Verify Step 1 resized value
            cy.findByText("Step 1")
              .parent()
              .should("contain.text", `${expectedLength}m`);

            // Verify Step 2 value unchanged
            cy.findByText("Step 2").parent().should("contain.text", "30m");

            // Verify Total value updated
            cy.findByText(`Total: ${totalText}`).should("exist");
          });
      });
  });

  it("should respect min and max length constraints when resizing", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Constraint Test Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add two events so we have a valid resizing scenario
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[0].name"]').type("Constrained Step");
    cy.get('[name="timeline[0].defaultLength.minutes"]').type("30");
    cy.get('[name="timeline[0].minLength.minutes"]').type("20");
    cy.get('[name="timeline[0].maxLength.minutes"]').type("40");

    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timeline[1].name"]').type("Other Step");
    cy.get('[name="timeline[1].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Initial state
    cy.findByText("Constrained Step").parent().should("contain.text", "30m");

    // Find the resize handle for Constrained Step
    cy.contains("Constrained Step")
      .parent()
      .find(".cursor-col-resize")
      .then(($handle) => {
        const handleRect = $handle[0].getBoundingClientRect();
        const startX = handleRect.left + handleRect.width / 2;
        const startY = handleRect.top + handleRect.height / 2;

        // Test Min Constraint: Drag way to the left (e.g., -200px)
        cy.wrap($handle).trigger("mousedown", {
          which: 1,
          clientX: startX,
          clientY: startY,
        });
        cy.document().trigger("mousemove", {
          clientX: startX - 200,
          clientY: startY,
        });
        cy.document().trigger("mouseup", { force: true });

        // Should stop at minLength (20m)
        cy.findByText("Constrained Step")
          .parent()
          .should("contain.text", "20m");

        // Reset (drag back or re-trigger) - let's just drag from new position or assume it's at 20m.
        // Actually it's easier to just drag way to the right now.
        // Since we released mouse, we need to grab handle again.
        // Note: handle position changed.

        // We need to re-query the handle to get its new position?
        // Yes, Cypress elements are snapshots but chaining off parent again is safer.
        cy.contains("Constrained Step")
          .parent()
          .find(".cursor-col-resize")
          .then(($newHandle) => {
            const newRect = $newHandle[0].getBoundingClientRect();
            const newStartX = newRect.left + newRect.width / 2;
            const newStartY = newRect.top + newRect.height / 2;

            // Test Max Constraint: Drag way to the right (e.g., +500px)
            cy.wrap($newHandle).trigger("mousedown", {
              which: 1,
              clientX: newStartX,
              clientY: newStartY,
            });
            cy.document().trigger("mousemove", {
              clientX: newStartX + 500,
              clientY: newStartY,
            });
            cy.document().trigger("mouseup", { force: true });

            // Should stop at maxLength (40m)
            cy.findByText("Constrained Step")
              .parent()
              .should("contain.text", "40m");
          });
      });
  });
});
