describe("Resume Create Operations", function () {
  describe("Create Operations", function () {
    beforeEach(function () {
      cy.resetData();
      cy.visit("/");
    });

    it("should display empty state when no resumes exist", function () {
      cy.findByText("There are no resumes yet.");
    });

    it("should create a new resume with required fields only", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Company").type("Acme Corp");
      cy.findByLabelText("Job").type("Software Engineer");

      cy.findByRole("button", { name: "Submit" }).click();

      // Should redirect to view page
      cy.url().should("include", "/resume/acme-corp-software-engineer");
      cy.findByText("Software Engineer");
      cy.findByText("Acme Corp");
    });

    it("should auto-generate slug from company and job", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Company").type("Big Tech");
      cy.findByLabelText("Job").type("Staff Engineer");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.url().should("include", "/resume/big-tech-staff-engineer");
    });

    it("should use custom slug when provided", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Company").type("Startup Inc");
      cy.findByLabelText("Job").type("CTO");
      cy.findByLabelText("Slug").type("my-custom-resume-slug");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.url().should("include", "/resume/my-custom-resume-slug");
    });

    it("should create a resume with all applicant fields", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Name").type("Jane Doe");
      cy.findByLabelText("Email").type("jane@example.com");
      cy.findByLabelText("Phone").type("555-1234");
      cy.findByLabelText("Address").type("123 Main St");
      cy.findByLabelText("Github").type("janedoe");
      cy.findByLabelText("LinkedIn").type("janedoe");
      cy.findByLabelText("Website").type("janedoe.dev");
      cy.findByLabelText("Company").type("Widgets Co");
      cy.findByLabelText("Job").type("Designer");

      cy.findByRole("button", { name: "Submit" }).click();

      // Should redirect to view page with contact info
      cy.url().should("include", "/resume/widgets-co-designer");
      cy.findByText("Jane Doe");
      cy.findByText("jane@example.com");
      cy.findByText("555-1234");
      cy.findByText("123 Main St");
      cy.findByText(/github.com\/janedoe/);
      cy.findByText(/linkedin.com\/in\/janedoe/);
      cy.findByText("janedoe.dev");
    });

    it("should show the new resume in the list on homepage", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Company").type("Listed Corp");
      cy.findByLabelText("Job").type("Engineer");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.visit("/");
      cy.findByText("Listed Corp");
    });

    it("should show validation error when required fields missing", function () {
      cy.visit("/new-resume");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("Failed to create Resume.");
    });

    it("should show validation error when only company is provided", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Company").type("Only Company");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("Failed to create Resume.");
    });

    it("should show validation error when only job is provided", function () {
      cy.visit("/new-resume");

      cy.findByLabelText("Job").type("Only Job");

      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("Failed to create Resume.");
    });
  });

  describe("Rapid Operations", function () {
    beforeEach(function () {
      cy.resetData();
    });

    it("should handle creating multiple resumes in sequence", function () {
      for (let i = 1; i <= 3; i++) {
        cy.visit("/new-resume");
        cy.findByLabelText("Company").type(`Company ${i}`);
        cy.findByLabelText("Job").type("Engineer");
        cy.findByRole("button", { name: "Submit" }).click();
        cy.url().should("include", `/resume/company-${i}-engineer`);
      }

      cy.visit("/");
      cy.findByText("Company 3");
      cy.findByText("Company 2");
      cy.findByText("Company 1");
    });

    it("should handle create then immediate edit", function () {
      cy.visit("/new-resume");
      cy.findByLabelText("Company").type("Quick Create Co");
      cy.findByLabelText("Job").type("Tester");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("link", { name: "Edit" }).click();
      cy.findByLabelText("Company").clear();
      cy.findByLabelText("Company").type("Quick Edit Co");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByText("Quick Edit Co");
    });

    it("should handle create then immediate delete", function () {
      cy.visit("/new-resume");
      cy.findByLabelText("Company").type("Quick Delete Co");
      cy.findByLabelText("Job").type("Manager");
      cy.findByRole("button", { name: "Submit" }).click();

      cy.findByRole("button", { name: "Delete" }).click();

      cy.url().should("eq", Cypress.config().baseUrl + "/");
      cy.findByText("There are no resumes yet.");
    });
  });
});
