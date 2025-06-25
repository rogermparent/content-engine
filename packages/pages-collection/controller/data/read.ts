import { readFile } from "fs-extra";
import { getPageDirectory, getPageFilePath } from "../filesystemDirectories";

export default async function getPageBySlug(slug: string) {
  const pageData = JSON.parse(
    String(await readFile(getPageFilePath(getPageDirectory(slug)))),
  );
  return pageData;
}
