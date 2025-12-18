# Content Engine Workspace

This monorepo hosts a group of packages that establish and re-use patterns to create content-driven websites with custom graphical editors.

The projects in [`packages`](packages) are libraries that could be published as reusable packages, and the ones in [`websites`](websites) are examples of concrete implementations using those packages.

Generally, a website made with these packages will span two projects: an editor and a website. The editor is a dynamic app that has serves as a custom-built CMS, and that CMS calls the website project to build a deployable static website with that content. Having this editor/website pattern combines the accessibility of a dynamic graphical CMS with the effortless hosting of a static website.

Reusable packages in this repo aim to be composable, allowing any implementation full control over the process of creating content. For example, a website can check in with any authentication service that's compatible with NextJS before calling the functions from `content-engine` to persist content to LMDB and the filesystem.

One standout in this monorepo is [`next-static-image`](packages/next-static-image), which enables build-time optimization of dynamic images in a NextJS static export project with minimal API changes. This package may graduate into its own repo eventually, but the websites in this repo serve as its best test target currently.

The [Recipe Website](websites/recipe-website) project is the most complete implementation of a real-world project using the code in this monorepo, but more are planned in the future.

# Running tests

## Unit Tests (Vitest)

This command builds a docker image with the code of this repository and runs the repository's unit tests:

```sh
./build_docker.sh content-engine
docker run -t content-engine ./run_tests.sh
```

## E2E Tests (Cypress)

End-to-end tests are available for the recipe editor. To run them:

```sh
cd websites/recipe-website/editor

# Interactive mode (with Cypress UI)
pnpm e2e-dev

# Headless mode (for CI)
pnpm e2e-dev:headless
```

See [cypress/README.md](websites/recipe-website/editor/cypress/README.md) for more details about the e2e test suite.

```
[+] Building 0.1s (10/10) FINISHED                                                                   docker:default
 => [internal] load build definition from Dockerfile                                                           0.0s
 => => transferring dockerfile: 226B                                                                           0.0s
 => [internal] load metadata for docker.io/library/node:22.14.0-alpine3.21@sha256:9bef0ef1e268f60627da9ba7d76  0.0s
 => [internal] load .dockerignore                                                                              0.0s
 => => transferring context: 154B                                                                              0.0s
 => [1/5] FROM docker.io/library/node:22.14.0-alpine3.21@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad0748  0.0s
 => [internal] load build context                                                                              0.0s
 => => transferring context: 1.07kB                                                                            0.0s
 => CACHED [2/5] WORKDIR /app                                                                                  0.0s
 => CACHED [3/5] COPY package.json package-lock.json .                                                         0.0s
 => CACHED [4/5] RUN npm install                                                                               0.0s
 => CACHED [5/5] COPY . .                                                                                      0.0s
 => exporting to image                                                                                         0.0s
 => => exporting layers                                                                                        0.0s
 => => writing image sha256:80007dbaeba9813527f4a4e663e6d773256f6e42f1b3c3fdf713fe45b4897c2f                   0.0s
 => => naming to docker.io/library/content-engine                                                                      0.0s


> my-react-app@0.0.0 test
> vitest


 RUN  v3.1.1 /app

 ✓ src/App.test.jsx (2 tests) 176ms
 ✓ test/basic.test.js (3 tests) 6ms
 ✓ test/suite.test.js (3 tests) 7ms

 Test Files  3 passed (3)
      Tests  8 passed (8)
   Start at  22:08:27
   Duration  3.74s (transform 93ms, setup 361ms, collect 282ms, tests 190ms, environment 1.95s, prepare 392ms)
```

# Running a specific test

This example runs all tests matching the name "basic":

```sh
./build_docker.sh content-engine
docker run -t content-engine ./run_tests.sh basic
```

# Running a vite dev server

Run this command to enable hot reloading via docker.

```sh
./build_docker.sh content-engine
docker run --network=host -v .:/app -it content-engine npm exec vite dev --host
```
