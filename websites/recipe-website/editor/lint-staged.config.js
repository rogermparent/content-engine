const config = {
  "*.{json,md,mdx,yml,yaml,css}": "prettier --check",
  "*.{js,jsx,ts,tsx}": [
    "prettier --check",
    "eslint",
    () => "pnpm run build",
    () => "pnpm run e2e-start:headless",
  ],
};

export default config;
