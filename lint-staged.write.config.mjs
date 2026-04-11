const config = {
  "*.{json,md,mdx,yml,yaml,css}": "prettier --write",
  "*.{js,jsx,ts,tsx,mjs}": ["prettier --write", "eslint --fix"],
};

export default config;
