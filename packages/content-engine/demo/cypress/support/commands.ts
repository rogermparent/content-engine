/// <reference types="cypress" />
import "@testing-library/cypress/add-commands";

declare global {
  namespace Cypress {
    interface Chainable {
      resetData(fixture?: string): Chainable<void>;
      initializeContentGit(): Chainable<void>;
      getContentGitLog(): Chainable<string[]>;
      getContentGitCommitFiles(): Chainable<
        Array<{ message: string; files: string[] }>
      >;
      checkNoteTitlesInOrder(titles: string[]): Chainable<void>;
      copyFixtures(fixtureName: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("resetData", (fixture) => {
  cy.task("resetData", fixture);
});

Cypress.Commands.add("initializeContentGit", () => {
  cy.task("initializeContentGit");
});

Cypress.Commands.add("getContentGitLog", () => {
  return cy.task<string[]>("getContentGitLog");
});

Cypress.Commands.add("getContentGitCommitFiles", () => {
  return cy.task<Array<{ message: string; files: string[] }>>(
    "getContentGitCommitFiles",
  );
});

Cypress.Commands.add("checkNoteTitlesInOrder", (titles: string[]) => {
  cy.findAllByRole("listitem").should("have.length", titles.length);
  cy.findAllByRole("listitem").each((el, i) =>
    cy.wrap(el).findByText(titles[i]),
  );
});

Cypress.Commands.add("copyFixtures", (fixtureName: string) => {
  cy.task("copyFixtures", fixtureName);
});
