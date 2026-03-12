# Content Engine

## Running a Single Cypress Spec (Recipe Editor)

```
cd websites/recipe-website/editor
pnpm exec start-server-and-test dev:test http://localhost:3000 "cypress run --spec cypress/e2e/<spec-file>.cy.ts"
```

Test runs attempt to use the same server port, so multiple runs must be executed sequentially.
