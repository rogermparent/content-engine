# Portfolio

A project portfolio/book application built on Discontent. The editor has basic user-gating with NextAuth and the export generates a fully static site.

## Sub-packages

| Package                                | Description                                                                                                                                                                                                                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio-website-common` (`common/`) | Shared controllers, components, and utilities used by both the editor and export. Includes the homepage controller and components for displaying projects and pages, using `@discontent/projects-collection`, `@discontent/pages-collection`, and `@discontent/menus-collection`. |
| `portfolio-website-editor` (`editor/`) | The Next.js CMS editor app. Handles project and page creation and editing, user authentication, and triggers static rebuilds.                                                                                                                                                     |
| `portfolio-website-export` (`export/`) | The Next.js static export app. Consumes the same content directory as the editor and generates an optimized static site with responsive images via `@discontent/next-static-image`.                                                                                               |

## Getting Started

Install package dependencies from the root:

```bash
pnpm install
```

## Setting up the editor

First, `cd` into `editor`. This is generally the main app server which will call sibling applications as needed.

Create a first user with the `create-user` script:

```bash
pnpm run create-user
```

Generate an OpenSSL secret key for NextAuth:

```bash
npx auth secret
```

Run the development server to try things out quickly:

```bash
pnpm run dev
```

Alternatively, build and run the optimized production server:

```bash
pnpm run build
pnpm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Test Suite

The editor app has a Cypress e2e test suite that can run against the development server (`e2e-dev`) or an optimized production build (`e2e-start`), both with `:headless` variants. `e2e-dev` is useful for rapid iteration, while `e2e-start` is faster and closer to production.

```bash
cd editor

# Against the dev server
pnpm e2e-dev            # Interactive (Cypress UI)
pnpm e2e-dev:headless   # Headless (for CI)

# Against a production build (run build first)
pnpm build
pnpm e2e-start          # Interactive (Cypress UI)
pnpm e2e-start:headless # Headless (for CI)
```
