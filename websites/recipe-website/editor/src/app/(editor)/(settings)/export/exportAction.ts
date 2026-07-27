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

  // Bake the owner's site-default theme + footer content into the static build.
  // The export layout reads SITE_THEME via getSiteTheme() and
  // SITE_FOOTER_NOTE / SITE_CONTACT via getSiteFooter(); absent → built-in
  // defaults. The deploy path is unaffected (it redeploys the already-built
  // out/).
  const { theme, footerNote, contact } = await readSettings();
  const extraEnv: Record<string, string> = {};
  if (theme) extraEnv.SITE_THEME = JSON.stringify(theme);
  if (footerNote) extraEnv.SITE_FOOTER_NOTE = footerNote;
  if (contact) extraEnv.SITE_CONTACT = JSON.stringify(contact);

  return commandAction(
    "build",
    Object.keys(extraEnv).length > 0 ? extraEnv : undefined,
  );
}
