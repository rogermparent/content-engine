import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./node_modules/recipe-website-common/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/component-library/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
export default config;
