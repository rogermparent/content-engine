import { defineConfig, devices } from "@playwright/test";

/*
 * Port 3029, not recipe's 3019 and not the cms demo's 3011 — the three apps in
 * this monorepo must not fight over a port, and `reuseExistingServer` makes a
 * collision look like a bizarre test failure rather than a conflict (which is
 * exactly what global-setup's fingerprint exists to catch).
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT) || 3029;
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
    // The site's default colour mode is "System"; Playwright already emulates
    // light, but pin it explicitly so visual baselines can't drift light/dark.
    colorScheme: "light",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },
  projects: [
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
  ],
  webServer: {
    command: BUILD ? "pnpm start:test" : "pnpm dev:test",
    url: `http://localhost:${PORT}`,
    timeout: BUILD ? 180_000 : 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
