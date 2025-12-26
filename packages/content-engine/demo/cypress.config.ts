import { defineConfig } from "cypress";
import { remove, copy, ensureDir } from "fs-extra";
import { resolve } from "node:path";
import simpleGit from "simple-git";

async function resetData(fixture?: string) {
  const testContentDir = resolve("test-content");
  await remove(testContentDir);
  if (fixture) {
    await copy(
      resolve("cypress", "fixtures", "test-content", fixture),
      testContentDir,
    );
  } else {
    await ensureDir(testContentDir);
  }
  return null;
}

async function copyFixtures(fixtureName: string) {
  const testContentDir = resolve("test-content");
  const fixtureDir = resolve(
    "cypress",
    "fixtures",
    "test-content",
    fixtureName,
  );
  await remove(fixtureDir);
  await copy(testContentDir, fixtureDir);
  return null;
}

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    setupNodeEvents(on) {
      on("task", {
        async getContentGitLog() {
          const git = simpleGit(resolve("test-content"));
          const log = await git.log();
          return log.all.map((item) => item.message);
        },
        async initializeContentGit() {
          const testContentDir = resolve("test-content");
          await ensureDir(testContentDir);
          const git = simpleGit(testContentDir);
          await git.init();
          await git
            .add(".")
            .commit("Initial commit", { "--allow-empty": null });
          return null;
        },
        resetData,
        copyFixtures,
      });
    },
    retries: {
      runMode: 2,
    },
  },
});
