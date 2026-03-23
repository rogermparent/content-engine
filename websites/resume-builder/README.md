# Next Resume Builder

This project is a minimal web app which provides a simple CRUD resume app, along with a "copy" function that serves as the primary workflow for quickly creating a resume similar but tailored to the individual job.

Currently, the site is built to display the resume as a styled page which can be printed as a PDF for use on job sites.

## Test Suite

Cypress e2e tests can run against the dev server (`e2e-dev`) or an optimized production build (`e2e-start`), both with `:headless` variants. `e2e-dev` is useful for rapid iteration, while `e2e-start` is faster and closer to production.

```bash
# Against the dev server
pnpm e2e-dev            # Interactive (Cypress UI)
pnpm e2e-dev:headless   # Headless (for CI)

# Against a production build (run build first)
pnpm build
pnpm e2e-start          # Interactive (Cypress UI)
pnpm e2e-start:headless # Headless (for CI)
```
