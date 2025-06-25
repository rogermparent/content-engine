import { readFile } from "fs-extra";
import { getMenuDirectory, getMenuFilePath } from "../filesystemDirectories";
import { Menu } from "../types";

export async function getMenuBySlug(slug: string): Promise<Menu> {
  const menuData = JSON.parse(
    String(await readFile(getMenuFilePath(getMenuDirectory(slug)))),
  );
  return menuData;
}

export default async function safeGetMenuBySlug(
  slug: string,
): Promise<Menu | undefined> {
  try {
    const menuData = await getMenuBySlug(slug);
    return menuData;
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return undefined;
    }
    throw e;
  }
}
