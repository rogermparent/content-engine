const config = {
  extends: ["next/core-web-vitals", "plugin:cypress/recommended"],
  plugins: ["cypress", "mocha"],
  rules: {
    "mocha/no-skipped-tests": "error",
    "mocha/no-exclusive-tests": "error",
  },
  ignores: [
    "/node_modules",
    "/.pnp",
    ".pnp.js",
    ".yarn/install-state.gz",
    "/website/.next/",
    "/editor/.next/",

    "/website/out/",

    "/content",
    "/test-content",
  ],
};

export default config;
