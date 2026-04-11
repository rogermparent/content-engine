# Next Resume Builder

A minimal web app for building and managing tailored resumes, built on Discontent. The primary workflow is to create a base resume and then use the **copy** function to quickly produce variations targeted at individual job applications.

Resumes are displayed as styled pages that can be printed to PDF for use on job sites.

## Getting Started

Install package dependencies from the root:

```bash
pnpm install
```

Run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Resume Data Model

Each resume stores the following fields:

| Field        | Description                            |
| ------------ | -------------------------------------- |
| `job`        | Target job title                       |
| `company`    | Target company name                    |
| `name`       | Your name                              |
| `phone`      | Phone number                           |
| `email`      | Email address                          |
| `address`    | Mailing address                        |
| `github`     | GitHub profile URL                     |
| `linkedin`   | LinkedIn profile URL                   |
| `website`    | Personal website URL                   |
| `skills`     | Array of skill strings                 |
| `education`  | Array of education entries             |
| `experience` | Array of work experience entries       |
| `projects`   | Array of project entries               |
| `date`       | Creation timestamp (used as index key) |

Resumes are indexed by `[date, slug]` in LMDB for fast listing.

## Copy Workflow

The copy function duplicates an existing resume as a starting point for a new variation. This is the intended workflow for quickly tailoring a resume to a specific job without starting from scratch.

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
