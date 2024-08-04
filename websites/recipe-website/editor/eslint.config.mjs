const config = {
  extends: ["next/core-web-vitals", "plugin:cypress/recommended"],
  plugins: ["cypress", "mocha"],
  rules: {
    "mocha/no-skipped-tests": "error",
    "mocha/no-exclusive-tests": "error",
  },
};

export default config;
