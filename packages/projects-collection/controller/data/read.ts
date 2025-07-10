import { readFile } from "fs-extra";
import {
  getProjectDirectory,
  getProjectFilePath,
} from "../filesystemDirectories";

export default async function getProjectBySlug(slug: string) {
  const projectData = JSON.parse(
    String(await readFile(getProjectFilePath(getProjectDirectory(slug)))),
  );
  return projectData;
}
