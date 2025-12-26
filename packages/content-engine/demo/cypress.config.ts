import { defineConfig } from "cypress";
import { remove, copy, ensureDir } from "fs-extra";
import { resolve } from "node:path";
import simpleGit from "simple-git";
import { rebuildIndex } from "content-engine/content/rebuildIndex";
import { noteConfig } from "./lib/notes";

async function resetData(fixture?: string) {
  const testContentDir = resolve("test-content");
  await remove(testContentDir);
  if (fixture) {
    await copy(
      resolve("cypress", "fixtures", "test-content", fixture),
      testContentDir,
    );
    // Rebuild the index after copying fixture data
    await rebuildIndex({
      config: noteConfig,
      contentDirectory: testContentDir,
    });
  } else {
    await ensureDir(testContentDir);
  }
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
          await git.add(".").commit("Initial commit", { "--allow-empty": null });
          return null;
        },
        resetData,
      });
    },
    retries: {
      runMode: 2,
    },
  },
});
