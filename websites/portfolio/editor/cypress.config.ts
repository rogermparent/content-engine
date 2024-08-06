import { defineConfig } from "cypress";
import { resolve } from "node:path";
import { copy, remove } from "fs-extra";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on) {
      on("task", {
        async resetData(fixture?: string) {
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
        },
      });
    },
    retries: {
      runMode: 2,
    },
  },
});
