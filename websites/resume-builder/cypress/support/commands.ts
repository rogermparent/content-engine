/// <reference types="cypress" />
import "@testing-library/cypress/add-commands";

declare global {
  namespace Cypress {
    interface Chainable {
      resetData(fixture?: string): Chainable<void>;
      initializeContentGit(): Chainable<void>;
      getContentGitLog(): Chainable<string[]>;
      copyFixtures(fixtureName: string): Chainable<void>;
      checkResumesInOrder(names: string[]): Chainable<void>;
    }
  }
}

Cypress.Commands.add("resetData", (fixture) => {
  cy.task("resetData", fixture);
  cy.request("/settings/invalidate-cache");
});

Cypress.Commands.add("initializeContentGit", () => {
  cy.task("initializeContentGit");
});

Cypress.Commands.add("getContentGitLog", () => {
  return cy.task<string[]>("getContentGitLog");
});

Cypress.Commands.add("copyFixtures", (fixtureName: string) => {
  cy.task("copyFixtures", fixtureName);
});

Cypress.Commands.add("checkResumesInOrder", (names: string[]) => {
  cy.findAllByRole("listitem").should("have.length", names.length);
  cy.findAllByRole("listitem").each((el, i) =>
    cy.wrap(el).findByText(names[i]),
  );
});
