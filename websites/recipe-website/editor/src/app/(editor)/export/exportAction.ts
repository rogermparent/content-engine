"use server";

import { commandAction } from "@/app/(recipes)/scriptAction";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
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
  return commandAction("build");
}
