import { readFile, readJson } from "fs-extra";
import {
  getProjectDirectory,
  getProjectFilePath,
} from "../filesystemDirectories";

export default async function getProjectBySlug(slug: string) {
  return readJson(getProjectFilePath(getProjectDirectory(slug)));
}
