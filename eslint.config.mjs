// @ts-check

import { FlatCompat } from "@eslint/eslintrc";
import pluginMocha from "eslint-plugin-mocha";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...compat.config({
    extends: ["next"],
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
    },
  }),
  {
    plugins: { mocha: pluginMocha },
  },
];
