import { readJSON } from "fs-extra";
import { getMenuDirectory, getMenuFilePath } from "../filesystemDirectories";
import { MenuItem, Menu } from "../types";

export default async function getMenuBySlug<Item = MenuItem>(
  slug: string,
): Promise<Menu<Item> | undefined> {
  try {
    const menuData = await readJSON(getMenuFilePath(getMenuDirectory(slug)));
    return menuData;
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return undefined;
    }
    throw e;
  }
}
