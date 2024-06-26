import { defineConfig } from "cypress";
import { cp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import simpleGit from "simple-git";

async function resetData(fixture?: string) {
  try {
    await rm(resolve("test-content"), { recursive: true });
  } catch (e) {}
  if (fixture) {
    await cp(
      resolve("cypress", "fixtures", "test-content", fixture),
      resolve("test-content"),
      { recursive: true },
    );
  }
  await cp(
    resolve("cypress", "fixtures", "users"),
    resolve("test-content", "users"),
    { recursive: true },
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
