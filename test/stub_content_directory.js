import { resolve } from "path";

export function getContentDirectory() {
  return resolve("websites", "recipe-website", "editor", "test-content");
}

export const contentDirectory = getContentDirectory();
