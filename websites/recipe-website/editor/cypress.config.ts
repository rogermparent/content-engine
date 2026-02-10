import { defineConfig } from "cypress";
import { remove, copy, writeFile, outputJSON } from "fs-extra";
import { resolve } from "node:path";
import simpleGit from "simple-git";

async function resetData(fixture?: string) {
  await remove(resolve("test-settings"));
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
    baseUrl: "http://localhost:3000",
    defaultCommandTimeout: 10000,
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
          await git.add(".").commit("Initial commit");
          return null;
        },
        resetData,
        copyFixtures,
        resolvePath(relativePath: string) {
          return resolve(relativePath);
        },
        async writeSettings(settings: Record<string, unknown>) {
          await outputJSON(
            resolve("test-settings", "settings.json"),
            settings,
            { spaces: 2 },
          );
          return null;
        },
        async loadGitFixture(fixture: string) {
          const outputDir = resolve("test-content");
          await remove(outputDir);
          const fixtureBundlePath = resolve(
            "cypress",
            "fixtures",
            "git-test-content",
            fixture,
          );
          await simpleGit().clone(fixtureBundlePath, outputDir);
          return null;
        },
      });
    },
    retries: {
      runMode: 2,
    },
  },
});
