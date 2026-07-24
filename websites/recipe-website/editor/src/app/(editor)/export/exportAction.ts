"use server";

import { commandAction } from "@/app/(recipes)/scriptAction";
import { readSettings } from "@/settings";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { ensureSymlink } from "fs-extra";
import { resolve } from "path";

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

  // Bake the owner's site-default theme into the static build. The export
  // layout reads SITE_THEME via getSiteTheme(); absent → built-in default. The
  // deploy path is unaffected (it redeploys the already-built out/).
  const { theme } = await readSettings();
  const extraEnv = theme ? { SITE_THEME: JSON.stringify(theme) } : undefined;

  return commandAction("build", extraEnv);
}
