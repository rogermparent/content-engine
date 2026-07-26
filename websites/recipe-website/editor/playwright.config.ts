import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT) || 3019;
const BUILD = !!process.env.PLAYWRIGHT_BUILD;

export default defineConfig({
  testDir: "./playwright",
  globalSetup: "./playwright/support/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
      scale: "css",
    },
  },
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}{-projectName}{ext}",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The app's default colour mode is "System"; Playwright already emulates
    // light, but pin it explicitly so visual baselines can't drift light/dark.
    colorScheme: "light",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "setup",
      testDir: "./playwright/tests",
      testMatch: /\.auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e",
      testDir: "./playwright/tests",
      grepInvert: /@mobile/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testDir: "./playwright/tests",
      grep: /@mobile/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "generators",
      testDir: "./playwright/fixture-generators",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: BUILD ? "pnpm start:test" : "pnpm dev:test",
    url: `http://localhost:${PORT}`,
    timeout: BUILD ? 180_000 : 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
