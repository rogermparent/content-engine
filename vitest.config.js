import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setupTests.js"],
    alias: {
      "next/cache": resolve("test", "stub_cache.js"),
      "next/navigation": resolve("test", "stub_navigation.js"),
      "@/auth": resolve("test", "stub_auth.js"),
      "content-engine/fs/getContentDirectory": resolve(
        "test",
        "stub_content_directory.js",
      ),
    },
  },
});
