import { defineConfig } from "cypress";
import { remove, copy, writeFile } from "fs-extra";
import { resolve } from "node:path";
import simpleGit from "simple-git";

async function resetData(fixture?: string) {
  await remove(resolve("test-content"));
  if (fixture) {
    await copy(
      resolve("cypress", "fixtures", "test-content", fixture),
      resolve("test-content"),
    );
  }
  await copy(
    resolve("cypress", "fixtures", "users"),
    resolve("test-content", "users"),
  );
  return null;
}

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on) {
      on("task", {
        async getContentGitLog() {
          const log = await simpleGit(resolve("test-content")).log();
          return log.all.map((item) => item.message);
        },
        async initializeContentGit() {
          const git = simpleGit(resolve("test-content"));
          await git.init();
          await writeFile(
            resolve("test-content", ".gitignore"),
            `
/transformed-images
/recipes/index
`,
          );
          await git.add(".").commit("Initial Commit");
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
