const config = {
  "*.{json,md,mdx,yml,yaml,css}": "prettier --check",
  "*.{js,jsx,ts,tsx}": ["prettier --check", "eslint"],
};

module.exports = config;
