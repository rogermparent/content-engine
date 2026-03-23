import { resolve } from "path";

import { contentDirectory } from "@discontent/cms/fs/getContentDirectory";

export const menusBaseDirectory = resolve(contentDirectory, "menus");

export function getMenuDirectory(slug: string) {
  return resolve(menusBaseDirectory, slug);
}

export function getMenuFilePath(basePath: string) {
  return basePath + "/menu.json";
}

export function getMenuUploadsDirectory(basePath: string) {
  return basePath + "/uploads";
}
