import { resolve, sep } from "path";

import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";

/**
 * Where projects live on disk.
 *
 * Two things here are load-bearing:
 *
 * 1. The content directory is resolved **per call**, not captured in a
 *    module-level const. This module used to import the eagerly-evaluated
 *    `contentDirectory`, which is computed at import time — so the
 *    `contentDirectory` argument could never actually take effect, and anything
 *    setting CONTENT_DIRECTORY after the module graph loaded silently wrote to
 *    the wrong tree.
 *
 * 2. Slugs are confined to the tree. `resolve()` happily walks upward, so a slug
 *    of `../../users` resolves outside `projects/` — and the delete action hands
 *    its slug straight to a recursive `rm`.
 */
export function getProjectsBaseDirectory(contentDirectory?: string): string {
  return resolve(contentDirectory ?? getContentDirectory(), "projects", "data");
}

/**
 * Resolve a slug to its project directory, refusing to escape the projects tree.
 *
 * Throws rather than sanitizing: a traversing slug is not a typo to be cleaned
 * up, and quietly rewriting it to something valid would let the attempt succeed
 * against a different project.
 */
export function getProjectDirectory(
  slug: string,
  contentDirectory?: string,
): string {
  const base = getProjectsBaseDirectory(contentDirectory);
  const resolved = resolve(base, slug);
  if (resolved !== base && !resolved.startsWith(base + sep)) {
    throw new Error(
      `Refusing to resolve project slug outside the projects tree: ${slug}`,
    );
  }
  return resolved;
}

export function getProjectFilePath(basePath: string): string {
  return resolve(basePath, "project.json");
}

export function getProjectUploadsDirectory(basePath: string): string {
  return resolve(basePath, "uploads");
}
