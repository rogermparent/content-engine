import { resolve } from "path";

import { vi } from "vitest";

function _getContentDirectory() {
  return resolve("websites", "recipe-website", "editor", "test-content");
}

export const getContentDirectory = vi.fn(_getContentDirectory);

export const contentDirectory = _getContentDirectory();
