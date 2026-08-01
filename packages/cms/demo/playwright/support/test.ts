import { test as base } from "@playwright/test";
import * as tasks from "./tasks";
import type { PaginationIndexChanges } from "./tasks";

type Fixtures = {
  resetData: (fixture?: string) => Promise<void>;
  initializeContentGit: () => Promise<void>;
  getContentGitLog: () => Promise<string[]>;
  getContentGitCommitFiles: () => Promise<
    Array<{ message: string; files: string[] }>
  >;
  copyFixtures: (fixtureName: string) => Promise<void>;
  readPaginationChanges: () => Promise<Record<string, PaginationIndexChanges>>;
  clearPaginationChanges: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  resetData: async ({}, use) => {
    await use(tasks.resetData);
  },
  initializeContentGit: async ({}, use) => {
    await use(tasks.initializeContentGit);
  },
  getContentGitLog: async ({}, use) => {
    await use(tasks.getContentGitLog);
  },
  getContentGitCommitFiles: async ({}, use) => {
    await use(tasks.getContentGitCommitFiles);
  },
  copyFixtures: async ({}, use) => {
    await use(tasks.copyFixtures);
  },
  readPaginationChanges: async ({}, use) => {
    await use(tasks.readPaginationChanges);
  },
  clearPaginationChanges: async ({}, use) => {
    await use(tasks.clearPaginationChanges);
  },
});

export { expect } from "@playwright/test";
