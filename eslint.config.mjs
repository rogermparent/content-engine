// @ts-check

import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { fixupPluginRules } from "@eslint/compat";

const patchedNextPlugin = fixupPluginRules(nextPlugin);
const patchedHooksPlugin = fixupPluginRules(hooksPlugin);

export default [
  {
    ignores: [
      "/.pnp",
      ".pnp.js",
      ".yarn/install-state.gz",
      "**/.next/",
      "websites/**/out/",
      "/content",
      "/test-content",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": patchedHooksPlugin,
      "@next/next": patchedNextPlugin,
    },
    rules: {
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
    languageOptions: {
      globals: {
        process: "readonly",
        module: "writable",
      },
    },
    settings: {
      next: {
        rootDir: "websites/*/*",
      },
    },
  },
];
