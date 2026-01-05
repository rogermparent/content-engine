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

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Dough Timeline");

    // Add event to the timeline
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[0].name"]').type("Rise Dough");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("60");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify timeline is displayed
    cy.findByText("Timelines").should("exist");
    cy.findByRole("region", { name: "Timeline: Dough Timeline" }).within(() => {
      cy.findByText("Rise Dough").should("exist");
      cy.findByText("1h 0m").should("exist");
    });
  });

  it("should be able to add a timeline event with min and max constraints", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Timeline Constraints Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Baking Timeline");

    // Add event with constraints
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[0].name"]').type("Bake");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("45");

    // Set min length
    cy.get('[name="timelines[0].events[0].minLength.minutes"]').type("30");

    // Set max length
    cy.get('[name="timelines[0].events[0].maxLength.minutes"]').type("60");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify timeline elements
    cy.findByLabelText("Timeline: Baking Timeline").within(() => {
      cy.findByText("Bake").should("exist");
      cy.findByDisplayValue("45").should("exist");
    });
  });

  it("should display multiple timeline events in order", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Multi-Step Timeline";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Main Timeline");

    // Event 1
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[0].name"]').type("Mix");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("10");

    // Event 2
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[1].name"]').type("Rest");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("20");
    cy.get('[name="timelines[0].events[1].activeTime"]').click(); // Uncheck (default is unchecked? No, let's check)

    // Let's check "Active Time?" for Mix
    cy.get('[name="timelines[0].events[0].activeTime"]').check();

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Main Timeline" }).within(() => {
      cy.findByText("Mix").should("exist");
      cy.findByText("10m").should("exist");
      cy.findByText("Rest").should("exist");
      cy.findByText("20m").should("exist");
    });
  });

  it("should show duration inputs only for resizable events", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Resizable vs Fixed Timeline";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    // Resizable Event (has min/max)
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[0].name"]').type("Resizable Step");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");
    cy.get('[name="timelines[0].events[0].minLength.minutes"]').type("20");
    cy.get('[name="timelines[0].events[0].maxLength.minutes"]').type("40");

    // Fixed Event (no min/max)
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[1].name"]').type("Fixed Step");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("15");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Test Timeline" }).within(() => {
      // Resizable step should have a duration input
      cy.findByLabelText("Resizable Step duration in minutes").should("exist");
      cy.findByDisplayValue("30").should("exist");

      // Fixed step should exist but NOT have a duration input
      cy.findByRole("article", { name: /Fixed Step: 15m$/ }).should("exist");
      cy.findByLabelText("Fixed Step duration in minutes").should("not.exist");
    });
  });

  it("should be able to resize a timeline event in the view", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Resize Test Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    // Add two events so we have a valid resizing scenario
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[0].name"]').type("Step 1");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");
    cy.get('[name="timelines[0].events[0].minLength.minutes"]').type("10");
    cy.get('[name="timelines[0].events[0].maxLength.minutes"]').type("60");

    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[1].name"]').type("Step 2");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Test Timeline" }).within(() => {
      // Initial state - verify Step 1 is 30m
      cy.findByLabelText("Step 1 duration in minutes").should(
        "have.value",
        "30",
      );

      // Change Step 1 duration to 45m
      cy.findByLabelText("Step 1 duration in minutes").clear().type("45");
      cy.findByLabelText("Step 1 duration in minutes").blur();

      // Verify Step 1 changed to 45
      cy.findByDisplayValue("45").should("exist");

      // Verify Step 2 value unchanged (not resizable, shows formatted text)
      cy.findByText("30m").should("exist");

      // Verify Duration value updated (45m + 30m = 75m = 1h 15m)
      cy.findByLabelText("Test Timeline duration: 1h 15m").should("exist");
    });
  });

  it("should respect min and max length constraints when resizing", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Constraint Test Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    // Add two events so we have a valid resizing scenario
    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[0].name"]').type("Constrained Step");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");
    cy.get('[name="timelines[0].events[0].minLength.minutes"]').type("20");
    cy.get('[name="timelines[0].events[0].maxLength.minutes"]').type("40");

    cy.findByText("Add Timeline Event").click();
    cy.get('[name="timelines[0].events[1].name"]').type("Other Step");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Test Timeline" }).within(() => {
      // Initial state
      cy.findByDisplayValue("30").should("exist");

      // Test Min Constraint: Try to set below minimum (10m when min is 20m)
      cy.findByLabelText("Constrained Step duration in minutes")
        .clear()
        .type("10");
      cy.findByLabelText("Constrained Step duration in minutes").blur();

      // Should be clamped to minLength (20m)
      cy.findByDisplayValue("20").should("exist");

      // Test Max Constraint: Try to set above maximum (50m when max is 40m)
      cy.findByLabelText("Constrained Step duration in minutes")
        .clear()
        .type("50");
      cy.findByLabelText("Constrained Step duration in minutes").blur();

      // Should be clamped to maxLength (40m)
      cy.findByDisplayValue("40").should("exist");

      // Test valid value within range
      cy.findByLabelText("Constrained Step duration in minutes")
        .clear()
        .type("35");
      cy.findByLabelText("Constrained Step duration in minutes").blur();

      // Should accept valid value
      cy.findByDisplayValue("35").should("exist");
    });
  });

  it("should display multiple parallel timelines", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Multiple Timelines Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add first timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Dough Timeline");
    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Mix Dough");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("15");

    // Add second timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Sauce Timeline");
    cy.get('[name="timelines[1].note"]').type("Can be prepared in parallel");
    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Cook Sauce");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("20");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify both timelines are displayed
    cy.findByRole("region", { name: "Timeline: Dough Timeline" }).should(
      "exist",
    );
    cy.findByRole("region", { name: "Timeline: Sauce Timeline" }).should(
      "exist",
    );

    // Verify events in each timeline
    cy.findByRole("region", { name: "Timeline: Dough Timeline" }).within(() => {
      cy.findByRole("article", { name: "Mix Dough: 15m" }).should("exist");
    });
    cy.findByRole("region", { name: "Timeline: Sauce Timeline" }).within(() => {
      cy.findByRole("article", { name: "Cook Sauce: 20m" }).should("exist");
      // Verify timeline note is displayed
      cy.findByText("Can be prepared in parallel").should("exist");
    });

    // Verify max duration (longest timeline is 20m)
    cy.findByLabelText("Maximum duration: 20m").should("exist");
  });

  it("should display timeline with starting offset when there are multiple timelines", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Timeline with Offset";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add first timeline with offset
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Delayed Timeline");
    cy.get('[name="timelines[0].default_offset.minutes"]').type("30");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Step After Wait");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("15");

    // Add second timeline to make offsets visible
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Immediate Timeline");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Quick Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("10");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify offset block is displayed for first timeline
    cy.findByRole("region", { name: "Timeline: Delayed Timeline" }).within(
      () => {
        cy.findByRole("article", { name: "Offset: 30m" }).should("exist");
        cy.findByDisplayValue("30").should("exist");
        cy.findByRole("article", { name: "Step After Wait: 15m" }).should(
          "exist",
        );
      },
    );

    // Verify second timeline also has offset (0m)
    cy.findByRole("region", { name: "Timeline: Immediate Timeline" }).within(
      () => {
        cy.findByRole("article", { name: "Offset: 0m" }).should("exist");
        cy.findByRole("article", { name: "Quick Task: 10m" }).should("exist");
      },
    );

    // Verify max duration includes offset (30m + 15m = 45m)
    cy.findByLabelText("Maximum duration: 45m").should("exist");

    // Verify duration of events only (not including offset)
    cy.findByLabelText("Delayed Timeline duration: 15m").should("exist");
  });

  it("should handle multiple timelines with different offsets", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Staggered Timelines";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: starts immediately
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Immediate Start");
    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Prep Work");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("20");

    // Timeline 2: starts after 10 minutes
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Delayed Start");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("10");
    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Secondary Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("25");

    // Timeline 3: starts after 5 minutes
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[2].name"]').type("Short Delay");
    cy.get('[name="timelines[2].default_offset.minutes"]').type("5");
    cy.findByRole("group", { name: "Timeline 3 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[2].events[0].name"]').type("Quick Check");
    cy.get('[name="timelines[2].events[0].defaultLength.minutes"]').type("5");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify all three timelines are displayed
    cy.findByRole("region", { name: "Timeline: Immediate Start" }).should(
      "exist",
    );
    cy.findByRole("region", { name: "Timeline: Delayed Start" }).should(
      "exist",
    );
    cy.findByRole("region", { name: "Timeline: Short Delay" }).should("exist");

    // Verify Timeline 1 has 0m offset (always visible)
    cy.findByRole("region", { name: "Timeline: Immediate Start" }).within(
      () => {
        cy.findByRole("article", { name: "Offset: 0m" }).should("exist");
      },
    );

    // Verify Timeline 2 has 10m offset
    cy.findByRole("region", { name: "Timeline: Delayed Start" }).within(() => {
      cy.findByRole("article", { name: "Offset: 10m" }).should("exist");
      cy.findByDisplayValue("10").should("exist");
    });

    // Verify Timeline 3 has 5m offset
    cy.findByRole("region", { name: "Timeline: Short Delay" }).within(() => {
      cy.findByRole("article", { name: "Offset: 5m" }).should("exist");
      cy.findByDisplayValue("5").should("exist");
    });

    // Max duration should be the longest timeline: 10m offset + 25m = 35m
    cy.findByLabelText("Maximum duration: 35m").should("exist");
  });

  it("should be able to resize offset in timeline with multiple timelines", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Resizable Offset Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add first timeline with offset
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");
    cy.get('[name="timelines[0].default_offset.minutes"]').type("20");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Main Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    // Add second timeline to make offsets visible
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Other Timeline");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Other Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("25");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Test Timeline" }).within(() => {
      // Initial state: offset is 20m
      cy.findByDisplayValue("20").should("exist");

      // Change offset to 35m
      cy.findByLabelText("Timeline offset in minutes").clear().type("35");
      cy.findByLabelText("Timeline offset in minutes").blur();

      // Verify offset changed to 35m
      cy.findByDisplayValue("35").should("exist");
      cy.findByRole("article", { name: "Main Task: 30m" }).should("exist");
    });

    // Verify max duration updated (35m offset + 30m task = 65m = 1h 5m)
    cy.findByLabelText("Maximum duration: 1h 5m").should("exist");
  });

  it("should display multiple events in parallel timelines", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Complex Multi-Timeline Recipe";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: Dough with multiple steps
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Dough Process");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Mix");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("10");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[1].name"]').type("Knead");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("15");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[2].name"]').type("Rise");
    cy.get('[name="timelines[0].events[2].defaultLength.minutes"]').type("60");

    // Timeline 2: Sauce with offset
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Sauce");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("20");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Simmer");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify Timeline 1 events
    cy.findByRole("region", { name: "Timeline: Dough Process" }).within(() => {
      cy.findByRole("article", { name: "Mix: 10m" }).should("exist");
      cy.findByRole("article", { name: "Knead: 15m" }).should("exist");
      cy.findByRole("article", { name: "Rise: 1h 0m" }).should("exist");
      // Verify Timeline 1 total duration
      cy.findByLabelText("Dough Process duration: 1h 25m").should("exist");
    });

    // Verify Timeline 2 with offset
    cy.findByRole("region", { name: "Timeline: Sauce" }).within(() => {
      cy.findByRole("article", { name: "Offset: 20m" }).should("exist");
      cy.findByDisplayValue("20").should("exist");
      cy.findByRole("article", { name: "Simmer: 30m" }).should("exist");
      // Verify Timeline 2 duration (events only, not offset)
      cy.findByLabelText("Sauce duration: 30m").should("exist");
    });

    // Max duration should be Timeline 1 (85m total) since Timeline 2 is only 50m with offset
    cy.findByLabelText("Maximum duration: 1h 25m").should("exist");
  });

  it("should display minimal offset handle at 0 and full block when greater than 0", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Offset Display Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add first timeline with no offset (0)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Zero Offset Timeline");
    // Don't set offset - defaults to 0

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Immediate Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("20");

    // Add second timeline with offset
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Delayed Timeline");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("30");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Later Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("15");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify first timeline has minimal offset display (0m)
    // The offset block should exist with aria-label but be visually minimal (no "Offset" text visible)
    cy.findByRole("region", { name: "Timeline: Zero Offset Timeline" }).within(
      () => {
        // Offset article should exist
        cy.findByRole("article", { name: "Offset: 0m" }).should("exist");
        // But should not contain visible "Offset" text (it's handle-only)
        cy.findByRole("article", { name: "Offset: 0m" }).should(
          "not.contain.text",
          "Offset",
        );
        // Input should exist but be hidden
        cy.findByLabelText("Timeline offset in minutes").should("exist");
      },
    );

    // Verify second timeline has full offset display (30m) with visible text
    cy.findByRole("region", { name: "Timeline: Delayed Timeline" }).within(
      () => {
        // Offset article should exist
        cy.findByRole("article", { name: "Offset: 30m" }).should("exist");
        // Should contain visible "Offset" label text
        cy.findByRole("article", { name: "Offset: 30m" }).should(
          "contain.text",
          "Offset",
        );
        // Input should be visible and have correct value
        cy.findByDisplayValue("30").should("be.visible");
      },
    );
  });

  it("should keep offset visible when changed to 0 and allow changing back with multiple timelines", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Offset Zero Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add first timeline with offset
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");
    cy.get('[name="timelines[0].default_offset.minutes"]').type("15");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Main Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    // Add second timeline to make offsets visible
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Other Timeline");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Other Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("20");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Test Timeline" }).within(() => {
      // Initial state: offset is 15m
      cy.findByDisplayValue("15").should("exist");

      // Change offset to 0
      cy.findByLabelText("Timeline offset in minutes").clear().type("0");
      cy.findByLabelText("Timeline offset in minutes").blur();

      // Verify offset is now 0m and shows minimal handle-only display
      cy.findByRole("article", { name: "Offset: 0m" }).should("exist");
      // Should not show "Offset" text when at 0 (handle-only)
      cy.findByRole("article", { name: "Offset: 0m" }).should(
        "not.contain.text",
        "Offset",
      );
      // Input should still exist with value 0
      cy.findByDisplayValue("0").should("exist");

      // Now change it back to a positive value
      // Click the handle to focus the hidden input
      cy.findByRole("button", { name: "Set timeline offset" }).click();
      // Type new value
      cy.findByLabelText("Timeline offset in minutes").type("12");
      cy.findByLabelText("Timeline offset in minutes").blur();

      // Verify offset increased from 0 (should be 12m and show full block)
      cy.findByDisplayValue("12").should("exist");
      // Now that offset is > 0, it should show the "Offset" text
      cy.findByRole("article", { name: "Offset: 12m" })
        .should("exist")
        .and("contain.text", "Offset");
    });
  });

  it("should display single timeline without name", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Timeline Without Name Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline without setting a name
    cy.findByText("Add Timeline").click();
    // Don't fill in the name field

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("First Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[1].name"]').type("Second Task");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("20");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify timeline region exists (with fallback name in aria-label)
    cy.findByRole("region", { name: "Timeline: Timeline" }).within(() => {
      // Verify events are displayed
      cy.findByRole("article", { name: "First Task: 30m" }).should("exist");
      cy.findByRole("article", { name: "Second Task: 20m" }).should("exist");

      // Verify duration is shown
      cy.findByLabelText("Timeline duration: 50m").should("exist");

      // Should not have an h4 element with text content (name is omitted)
      cy.get("h4").should("not.exist");

      // Verify offset is NOT shown (single timeline)
      cy.findByRole("article", { name: /Offset/ }).should("not.exist");
    });
  });

  it("should display multiple timelines without names", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Multiple Unnamed Timelines";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add first timeline without name
    cy.findByText("Add Timeline").click();
    // Don't fill in the name field

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Task A");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("25");

    // Add second timeline without name
    cy.findByText("Add Timeline").click();
    // Don't fill in the name field
    cy.get('[name="timelines[1].default_offset.minutes"]').type("10");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Task B");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("30");

    // Add third timeline without name
    cy.findByText("Add Timeline").click();
    // Don't fill in the name field

    cy.findByRole("group", { name: "Timeline 3 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[2].events[0].name"]').type("Task C");
    cy.get('[name="timelines[2].events[0].defaultLength.minutes"]').type("15");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify all three timeline regions exist (with fallback names in aria-labels)
    cy.findAllByRole("region", { name: "Timeline: Timeline" }).should(
      "have.length",
      3,
    );

    // Verify events from each timeline are displayed
    cy.findByRole("article", { name: "Task A: 25m" }).should("exist");
    cy.findByRole("article", { name: "Task B: 30m" }).should("exist");
    cy.findByRole("article", { name: "Task C: 15m" }).should("exist");

    // Verify no timeline name headings are displayed
    cy.get("h4").should("not.exist");

    // Verify offsets ARE shown (multiple timelines)
    // Check that we have at least 2 offsets with 0m (Timeline 1 and Timeline 3)
    cy.findAllByRole("article", { name: "Offset: 0m" }).should(
      "have.length.at.least",
      2,
    );
    // Check that we have exactly 1 offset with 10m (Timeline 2) and display value
    cy.findAllByRole("article", { name: "Offset: 10m" }).should(
      "have.length",
      1,
    );
    cy.findAllByDisplayValue("10").should("have.length", 1);

    // Verify max duration (Timeline 2: 10m offset + 30m = 40m is longest)
    cy.findByLabelText("Maximum duration: 40m").should("exist");
  });

  it("should highlight overlapping active events as conflicts", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Overlap Conflict Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: Active event from 0-20m
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Timeline 1");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Active Task 1");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("20");
    cy.get('[name="timelines[0].events[0].activeTime"]').check();

    // Timeline 2: Active event from 10-30m (overlaps with Timeline 1)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Timeline 2");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("10");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Active Task 2");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("20");
    cy.get('[name="timelines[1].events[0].activeTime"]').check();

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Both active events should be marked as having overlap conflicts
    cy.findByRole("region", { name: "Timeline: Timeline 1" }).within(() => {
      cy.findByRole("article", {
        name: /Active Task 1.*overlap conflict/,
      }).should("exist");
    });
    cy.findByRole("region", { name: "Timeline: Timeline 2" }).within(() => {
      cy.findByRole("article", {
        name: /Active Task 2.*overlap conflict/,
      }).should("exist");
    });
  });

  it("should not highlight non-active overlapping events", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Non-Active Overlap Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: Non-active event from 0-20m
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Timeline 1");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Passive Task 1");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("20");
    // Don't check activeTime - leave it as passive

    // Timeline 2: Non-active event from 10-30m (overlaps but both passive)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Timeline 2");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("10");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Passive Task 2");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("20");
    // Don't check activeTime - leave it as passive

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Neither event should have overlap conflict (both are passive)
    cy.findByRole("region", { name: "Timeline: Timeline 1" }).within(() => {
      cy.findByRole("article", { name: /Passive Task 1/ })
        .invoke("attr", "aria-label")
        .should("not.contain", "overlap conflict");
    });

    cy.findByRole("region", { name: "Timeline: Timeline 2" }).within(() => {
      cy.findByRole("article", { name: /Passive Task 2/ })
        .invoke("attr", "aria-label")
        .should("not.contain", "overlap conflict");
    });
  });

  it("should not highlight when only one event is active in overlap", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Mixed Active Overlap Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: Active event from 0-20m
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Timeline 1");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Active Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("20");
    cy.get('[name="timelines[0].events[0].activeTime"]').check();

    // Timeline 2: Passive event from 10-30m (overlaps but passive)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Timeline 2");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("10");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Passive Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("20");
    // Don't check activeTime - leave it as passive

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Active task should NOT have conflict (other task is passive)
    cy.findByRole("region", { name: "Timeline: Timeline 1" }).within(() => {
      cy.findByRole("article", { name: /Active Task/ })
        .invoke("attr", "aria-label")
        .should("not.contain", "overlap conflict");
    });

    // Passive task should NOT have conflict
    cy.findByRole("region", { name: "Timeline: Timeline 2" }).within(() => {
      cy.findByRole("article", { name: /Passive Task/ })
        .invoke("attr", "aria-label")
        .should("not.contain", "overlap conflict");
    });
  });

  it("should update overlap highlighting when single event is resized", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Single Event Dynamic Overlap";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: Single active event from 0-15m (short, no overlap initially)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Timeline 1");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Short Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("15");
    cy.get('[name="timelines[0].events[0].minLength.minutes"]').type("10");
    cy.get('[name="timelines[0].events[0].maxLength.minutes"]').type("40");
    cy.get('[name="timelines[0].events[0].activeTime"]').check();

    // Timeline 2: Active event from 20-35m (no overlap initially)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Timeline 2");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("20");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Later Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("15");
    cy.get('[name="timelines[1].events[0].activeTime"]').check();

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Timeline 1" }).within(() => {
      // Initially no overlap - verify no conflict
      cy.findByRole("article", { name: /Short Task/ })
        .invoke("attr", "aria-label")
        .should("not.contain", "overlap conflict");

      // Verify the duration input exists
      cy.findByDisplayValue("15").should("exist");

      // Resize Short Task to make it longer and create overlap (extend to 25m to overlap with Later Task at 20m)
      cy.findByLabelText("Short Task duration in minutes").clear().type("25");
      cy.findByLabelText("Short Task duration in minutes").blur();

      // Wait for state update and re-render, then check for overlap conflict
      cy.findByRole("article", { name: /Short Task/ })
        .invoke("attr", "aria-label")
        .should("contain", "overlap conflict");
    });

    cy.findByRole("region", { name: "Timeline: Timeline 2" }).within(() => {
      cy.findByRole("article", { name: /Later Task/ })
        .invoke("attr", "aria-label")
        .should("contain", "overlap conflict");
    });
  });

  it("should update overlap highlighting when event in multi-event timeline is resized", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Multi Event Dynamic Overlap";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Timeline 1: Multiple events - active event from 0-15m, then passive 15-25m
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Timeline 1");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("First Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("15");
    cy.get('[name="timelines[0].events[0].minLength.minutes"]').type("10");
    cy.get('[name="timelines[0].events[0].maxLength.minutes"]').type("40");
    cy.get('[name="timelines[0].events[0].activeTime"]').check();

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[1].name"]').type("Second Task");
    cy.get('[name="timelines[0].events[1].defaultLength.minutes"]').type("10");

    // Timeline 2: Active event from 20-35m (no overlap with first timeline initially)
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[1].name"]').type("Timeline 2");
    cy.get('[name="timelines[1].default_offset.minutes"]').type("20");

    cy.findByRole("group", { name: "Timeline 2 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[1].events[0].name"]').type("Later Task");
    cy.get('[name="timelines[1].events[0].defaultLength.minutes"]').type("15");
    cy.get('[name="timelines[1].events[0].activeTime"]').check();

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    cy.findByRole("region", { name: "Timeline: Timeline 1" }).within(() => {
      // Initially no overlap
      cy.findByRole("article", { name: /First Task/ })
        .invoke("attr", "aria-label")
        .should("not.contain", "overlap conflict");

      // Verify initial value
      cy.findByDisplayValue("15").should("exist");

      // Resize First Task to make it longer and create overlap (extend to 30m to overlap with Later Task)
      cy.findByLabelText("First Task duration in minutes").clear().type("30");
      cy.findByLabelText("First Task duration in minutes").blur();

      // Check for overlap conflict
      cy.findByRole("article", { name: /First Task/ })
        .invoke("attr", "aria-label")
        .should("contain", "overlap conflict");
    });

    cy.findByRole("region", { name: "Timeline: Timeline 2" }).within(() => {
      cy.findByRole("article", { name: /Later Task/ })
        .invoke("attr", "aria-label")
        .should("contain", "overlap conflict");
    });
  });

  it("should display zoom input with default value of 1", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Zoom Default Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify zoom input exists with default value of 1
    cy.findByLabelText("Timeline zoom multiplier").should("exist");
    cy.findByLabelText("Timeline zoom multiplier").should("have.value", "1");

    // Verify "Zoom" label is displayed
    cy.findByText("Zoom").should("exist");
  });

  it("should increase timeline width when zoom is increased", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Zoom Increase Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify initial width is 100%
    cy.findByRole("group", { name: "Timeline container" })
      .children()
      .first()
      .should("have.attr", "style", "width: 100%;");

    // Change zoom to 2
    cy.findByLabelText("Timeline zoom multiplier").clear().type("2");
    cy.findByLabelText("Timeline zoom multiplier").blur();

    // Verify width is now 200%
    cy.findByRole("group", { name: "Timeline container" })
      .children()
      .first()
      .should("have.attr", "style", "width: 200%;");
  });

  it("should enforce minimum zoom value of 1", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Zoom Minimum Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Try to set zoom below 1
    cy.findByLabelText("Timeline zoom multiplier").clear().type("0.5");
    cy.findByLabelText("Timeline zoom multiplier").blur();

    // Should reset to 1 (the previous valid value)
    cy.findByLabelText("Timeline zoom multiplier").should("have.value", "1");

    // Width should still be 100%
    cy.findByRole("group", { name: "Timeline container" })
      .children()
      .first()
      .should("have.attr", "style", "width: 100%;");
  });

  it("should allow decimal zoom values", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Zoom Decimal Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Set zoom to 1.5
    cy.findByLabelText("Timeline zoom multiplier").clear().type("1.5");
    cy.findByLabelText("Timeline zoom multiplier").blur();

    // Verify value is 1.5 and width is 150%
    cy.findByLabelText("Timeline zoom multiplier").should("have.value", "1.5");
    cy.findByRole("group", { name: "Timeline container" })
      .children()
      .first()
      .should("have.attr", "style", "width: 150%;");
  });

  it("should make timeline container scrollable when zoomed in", function () {
    cy.findByRole("heading", { name: "New Recipe" });
    const newRecipeTitle = "Zoom Scroll Test";

    cy.findAllByLabelText("Name").first().clear();
    cy.findAllByLabelText("Name").first().type(newRecipeTitle);

    // Add a timeline
    cy.findByText("Add Timeline").click();
    cy.get('[name="timelines[0].name"]').type("Test Timeline");

    cy.findByRole("group", { name: "Timeline 1 editor" }).within(() => {
      cy.findByText("Add Timeline Event").click();
    });
    cy.get('[name="timelines[0].events[0].name"]').type("Task");
    cy.get('[name="timelines[0].events[0].defaultLength.minutes"]').type("30");

    cy.findByText("Submit").click();

    cy.findByRole("heading", { name: newRecipeTitle });

    // Verify container has overflow-x-auto class
    cy.findByRole("group", { name: "Timeline container" }).should(
      "have.class",
      "overflow-x-auto",
    );

    // Set zoom to 3 to create overflow
    cy.findByLabelText("Timeline zoom multiplier").clear().type("3");
    cy.findByLabelText("Timeline zoom multiplier").blur();

    // Verify width is 300% (creating horizontal scroll)
    cy.findByRole("group", { name: "Timeline container" })
      .children()
      .first()
      .should("have.attr", "style", "width: 300%;");

    // Verify the container is scrollable (scrollWidth > clientWidth)
    cy.findByRole("group", { name: "Timeline container" }).then(($el) => {
      expect($el[0].scrollWidth).to.be.greaterThan($el[0].clientWidth);
    });
  });
});
