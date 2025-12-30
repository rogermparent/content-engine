import { readJson } from "fs-extra";
import { getPageDirectory, getPageFilePath } from "../filesystemDirectories";

export default async function getPageBySlug(slug: string) {
  return readJson(getPageFilePath(getPageDirectory(slug)));
}
