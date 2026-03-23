const config = {
  "*.{json,md,mdx,yml,yaml,css}": "prettier --check",
  "*.{js,jsx,ts,tsx,mjs}": ["prettier --check", "eslint"],
};

export default config;
