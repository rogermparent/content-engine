import { resolve } from "path";

import { contentDirectory } from "@discontent/cms/fs/getContentDirectory";

export const projectsBaseDirectory = resolve(contentDirectory, "projects");

export function getProjectDirectory(slug: string) {
  return resolve(projectsBaseDirectory, slug);
}

export function getProjectFilePath(basePath: string) {
  return basePath + "/project.json";
}

export function getProjectUploadsDirectory(basePath: string) {
  return basePath + "/uploads";
}
