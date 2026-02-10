import { resolve } from "path";

export function getContentDirectory() {
  if (process.env.CONTENT_DIRECTORY) return process.env.CONTENT_DIRECTORY;
  if (process.env.TEST_MODE) return resolve("test-content");
  return resolve("content");
}

export const contentDirectory = getContentDirectory();
