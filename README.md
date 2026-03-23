# Content Engine Workspace

This monorepo hosts a group of packages that establish and re-use patterns to create content-driven websites with custom graphical editors.

The projects in [`packages`](packages) are libraries that could be published as reusable packages, and the ones in [`websites`](websites) are examples of concrete implementations using those packages.

Generally, a website made with these packages will span two projects: the editor and the export. The editor is a dynamic app that has serves as a custom-built CMS, and that CMS calls the export project to build a static website with that content. Having this editor/website pattern combines the accessibility of a dynamic graphical CMS with the effortless hosting of a static website.

Reusable packages in this repo aim to be composable, allowing any implementation full control over the process of creating content. For example, a website can check in with any authentication service that's compatible with NextJS before calling the functions from `@discontent/cms` to persist content to LMDB and the filesystem.

One standout in this monorepo is [`@discontent/next-static-image`](packages/next-static-image), which enables build-time optimization of dynamic images in a NextJS static export project with minimal API changes. This package may graduate into its own repo eventually, but the websites in this repo serve as its best test target currently.

The [Recipe Website](websites/recipe-website) project is the most complete implementation of a real-world project using the code in this monorepo, but more are planned in the future.

# Running tests

## E2E Tests (Cypress)

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
