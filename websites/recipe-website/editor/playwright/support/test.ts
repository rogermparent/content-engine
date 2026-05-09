import { test as base } from "@playwright/test";
import * as tasks from "./tasks";

const CACHE_INVALIDATE_PATH = "/settings/test-invalidate-cache";

type Fixtures = {
  resetData: (fixture?: string) => Promise<void>;
  loadGitFixture: (fixture: string) => Promise<void>;
  initializeContentGit: () => Promise<void>;
  getContentGitLog: () => Promise<string[]>;
  copyFixtures: (fixtureName: string) => Promise<void>;
  writeSettings: (settings: Record<string, unknown>) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  resetData: async ({ request }, use) => {
    await use(async (fixture) => {
      await tasks.resetData(fixture);
      await request.get(CACHE_INVALIDATE_PATH);
    });
  },
  loadGitFixture: async ({ request }, use) => {
    await use(async (fixture) => {
      await tasks.loadGitFixture(fixture);
      await request.get(CACHE_INVALIDATE_PATH);
    });
  },
  initializeContentGit: async ({ request }, use) => {
    await use(async () => {
      await tasks.initializeContentGit();
      await request.get(CACHE_INVALIDATE_PATH);
    });
  },
  getContentGitLog: async ({}, use) => {
    await use(tasks.getContentGitLog);
  },
  copyFixtures: async ({}, use) => {
    await use(tasks.copyFixtures);
  },
  writeSettings: async ({ request }, use) => {
    await use(async (settings) => {
      await tasks.writeSettings(settings);
      await request.get(CACHE_INVALIDATE_PATH);
    });
  },
});

export { expect } from "@playwright/test";
export type { Page, Locator } from "@playwright/test";
