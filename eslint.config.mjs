import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginMocha from "eslint-plugin-mocha";

const eslintConfig = defineConfig([
  pluginMocha.configs.recommended,
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: [
          "websites/portfolio/common",
          "websites/portfolio/editor",
          "websites/portfolio/export",
          "websites/recipe-website/common",
          "websites/recipe-website/editor",
          "websites/recipe-website/export",
          "websites/resume-builder",
        ],
      },
    },
    rules: {
      "mocha/no-exclusive-tests": "error",
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
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
