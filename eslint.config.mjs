// @ts-check

import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import mochaPlugin from "eslint-plugin-mocha";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { fixupPluginRules } from "@eslint/compat";

const patchedNextPlugin = fixupPluginRules(nextPlugin);
const patchedHooksPlugin = fixupPluginRules(hooksPlugin);

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
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
  // {
  //   ignores: [
  //     "/.pnp",
  //     ".pnp.js",
  //     ".yarn/install-state.gz",
  //     "**/.next/",
  //     "websites/**/out/",
  //     "/content",
  //     "/test-content",
  //   ],
  // },
  // eslint.configs.recommended,
  // ...tseslint.configs.recommended,
  // mochaPlugin.configs.flat.recommended,
  // {
  //   files: ["**/*.ts", "**/*.tsx"],
  //   plugins: {
  //     react: reactPlugin,
  //     "react-hooks": patchedHooksPlugin,
  //     "@next/next": patchedNextPlugin,
  //     mocha: mochaPlugin,
  //   },
  //   rules: {
  //     ...reactPlugin.configs["jsx-runtime"].rules,
  //     ...hooksPlugin.configs.recommended.rules,
  //     ...nextPlugin.configs.recommended.rules,
  //     ...nextPlugin.configs["core-web-vitals"].rules,
  //     "@next/next/no-img-element": "error",
  //     "@typescript-eslint/no-unused-vars": [
  //       "error",
  //       {
  //         args: "all",
  //         argsIgnorePattern: "^_",
  //         caughtErrors: "all",
  //         caughtErrorsIgnorePattern: "^_",
  //         destructuredArrayIgnorePattern: "^_",
  //         varsIgnorePattern: "^_",
  //         ignoreRestSiblings: true,
  //       },
  //     ],
  //   },
  //   languageOptions: {
  //     globals: {
  //       process: "readonly",
  //       module: "writable",
  //     },
  //   },
  //   settings: {
  //     next: {
  //       rootDir: "websites/*/*",
  //     },
  //   },
  // },
];
