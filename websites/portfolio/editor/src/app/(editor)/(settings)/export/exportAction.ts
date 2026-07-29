"use server";

import { rebuildIndex } from "@discontent/cms/content/rebuildIndex";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { pageContentConfig } from "@discontent/pages-collection/controller/pageContentConfig";
import { projectContentConfig } from "@discontent/projects-collection/controller/projectContentConfig";
import { ensureSymlink } from "fs-extra";
import { resolve } from "path";
import { readSettings } from "@/settings";
import { commandAction } from "./scriptAction";

/**
 * Build the static site.
 *
 * Three things happen here that the deleted `/build` route did not do:
 *
 * 1. **The index is rebuilt first.** The homepage *is* the index — it reads
 *    LMDB, not the JSON files — so a stale index does not merely mis-sort a
 *    list, it publishes a stale *homepage*. Rebuilding is cheap and derived
 *    state should never be the thing a publish depends on being fresh.
 * 2. **Uploads and images are symlinked into the export's `public/`.** Next
 *    stats everything under `public/`, and a *dangling* symlink there fails the
 *    build with a bare ENOENT naming neither the link nor its target — so these
 *    are ensured immediately before the build rather than left to setup.
 * 3. **The owner's settings are baked in.** The export app has no settings
 *    store; it reads `SITE_THEME`, `SITE_LAYOUT` and the `NEXT_PUBLIC_SITE_*`
 *    vars at build time. Without this the published site would ignore
 *    everything set in the editor — which is exactly what made the posture a
 *    developer-only feature.
 */
export async function buildExport() {
  const contentDirectory = getContentDirectory();
  const exportDirectory = resolve("..", "export");

  await ensureSymlink(
    resolve(contentDirectory, "transformed-images"),
    resolve(exportDirectory, "public", "image"),
  );
  await ensureSymlink(
    resolve(contentDirectory, "uploads"),
    resolve(exportDirectory, "public", "uploads"),
  );

  await rebuildIndex({ config: projectContentConfig, contentDirectory });
  await rebuildIndex({ config: pageContentConfig, contentDirectory });

  const { theme, posture, title, description, statement } =
    await readSettings();
  const extraEnv: Record<string, string> = {};
  if (theme) extraEnv.SITE_THEME = JSON.stringify(theme);
  if (posture) extraEnv.SITE_LAYOUT = posture;
  if (title) extraEnv.NEXT_PUBLIC_SITE_TITLE = title;
  if (description) extraEnv.NEXT_PUBLIC_SITE_DESCRIPTION = description;
  if (statement) extraEnv.NEXT_PUBLIC_SITE_STATEMENT = statement;

  return commandAction(
    "build",
    Object.keys(extraEnv).length > 0 ? extraEnv : undefined,
  );
}
