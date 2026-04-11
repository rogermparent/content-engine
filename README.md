# Discontent

A composable CMS system for building content-driven websites with custom graphical editors. All reusable packages are published under the `@discontent/` npm scope.

The projects in [`packages`](packages) are libraries that can be published as reusable packages, and the ones in [`websites`](websites) are concrete implementations built with those packages.

## Architecture

Generally, a website built with Discontent spans two projects: the **editor** and the **export**. The editor is a dynamic Next.js app that serves as a custom-built CMS. When content changes, the editor calls the export project to rebuild a static website from that content. This pattern combines the accessibility of a graphical CMS with the simplicity of static site hosting.

Reusable packages are composable — any implementation retains full control over the content pipeline. For example, a website can authenticate via any NextAuth-compatible provider before calling `@discontent/cms` to persist content to LMDB and the filesystem.

## Packages

| Package                                                           | Description                                                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`@discontent/cms`](packages/cms)                                 | Core CMS engine: CRUD operations, LMDB indexing, git commits, filesystem utilities, and form parsing, all driven by a `ContentTypeConfig` |
| [`@discontent/component-library`](packages/component-library)     | Shared React UI library: form inputs, display components, and shadcn/ui primitives                                                        |
| [`@discontent/next-static-image`](packages/next-static-image)     | Build-time image optimization for Next.js static exports using `sharp`                                                                    |
| [`@discontent/menus-collection`](packages/menus-collection)       | Content module for managing navigation menus with nested `MenuItem` entries                                                               |
| [`@discontent/pages-collection`](packages/pages-collection)       | Content module for managing CMS pages with name, date, and markdown content                                                               |
| [`@discontent/projects-collection`](packages/projects-collection) | Content module for managing portfolio projects with name, date, and markdown content                                                      |

## Websites

| Website                                     | Description                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`recipe-website`](websites/recipe-website) | A recipe book with fractional ingredient quantities, full-text search, and a static export |
| [`portfolio`](websites/portfolio)           | A project portfolio/book with NextAuth user-gating and a static export                     |
| [`resume-builder`](websites/resume-builder) | A minimal CRUD app for building and managing tailored resumes, with PDF-print support      |

The [Recipe Website](websites/recipe-website) is the most complete implementation and the primary test target for the packages.

## Running Tests

### E2E Tests (Cypress)

End-to-end tests are available for the recipe editor. Tests can run against the dev server (`e2e-dev`) or an optimized production build (`e2e-start`). `e2e-dev` is useful for rapid iteration, while `e2e-start` is faster and closer to production.

```sh
cd websites/recipe-website/editor

# Against the dev server
pnpm e2e-dev            # Interactive (Cypress UI)
pnpm e2e-dev:headless   # Headless (for CI)

# Against a production build (run build first)
pnpm build
pnpm e2e-start          # Interactive (Cypress UI)
pnpm e2e-start:headless # Headless (for CI)
```

See [cypress/README.md](websites/recipe-website/editor/cypress/README.md) for more details about the e2e test suite.
