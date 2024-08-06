/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('signIn', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       signIn(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
import "@testing-library/cypress/add-commands";

interface SignInOptions {
  email: string;
  password: string;
}

/* eslint-disable @typescript-eslint/no-namespace */

declare global {
  namespace Cypress {
    interface Chainable {
      resetData(fixture?: string): Chainable<void>;
      fillSignInForm(user?: SignInOptions): Chainable<void>;
      signIn(user?: SignInOptions): Chainable<void>;
      checkNamesInOrder(names: string[]): Chainable<void>;
    }
  }
}

Cypress.Commands.add("resetData", (fixture) => {
  cy.task("resetData", fixture);
  fetch("http://localhost:3000/settings/invalidate-cache");
});

Cypress.Commands.add("checkNamesInOrder", (names: string[]) => {
  cy.findAllByRole("listitem").should("have.length", names.length);
  cy.findAllByRole("listitem").each((el, i) =>
    cy.wrap(el).findByText(names[i]),
  );
});

Cypress.Commands.add(
  "fillSignInForm",
  ({ email = "admin@nextmail.com", password = "password" } = {}) => {
    cy.findByLabelText("Email").type(email, { force: true });
    cy.findByLabelText("Password").type(password, { force: true });
    cy.findByText("Sign in with Credentials").click();
  },
);

Cypress.Commands.add("signIn", (options) => {
  cy.findByText("Sign In").click();
  cy.fillSignInForm(options);
});
