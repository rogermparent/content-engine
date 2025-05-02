# Recipe Website

This project is a proof-of-concept application that serves the purpose of a recipe book, useful both privately and shared on the Internet. The editor has basic user-gating with NextAuth, mostly just to show off the functionality but can also be improved to provide decent security for an editor server that can be accessed over a network.

The primary data source is a tree of directories in the Content Directory, which by default is named `content` and located at the root of the project.

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

The editor app has a Cypress e2e test suite that can run against the development server or the optimized production build via two sets of scripts: `e2e-dev` and `e2e-start` both with `:headless` variants.

`e2e-dev` is helpful for rapid development, while `e2e-start` runs faster and is more reflective of production. Remember to run `build` after any changes for those to apply to `e2e-start`!

## Docker

The root of the monorepo is equipped with a basic Dockerfile which enables running this editor.

Use the following command in the root of this repo to build a Docker image:

```bash
docker build -t content-engine-recipe-website .
```

Now you can run the image:

```bash
docker run --name recipe-editor -p 3000:3000 content-engine-recipe-website:latest
```

And now you should be able to access the editor at `localhost:3000` with the baked-in account `admin@example.com`/`password`

This is a very basic container setup and currently cannot be recommended for a production deploy.