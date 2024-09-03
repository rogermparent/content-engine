import { resolve, join } from "path";

import { contentDirectory } from "content-engine/fs/getContentDirectory";

export const resumesBaseDirectory = resolve(contentDirectory, "resumes");

export const resumeDataDirectory = resolve(resumesBaseDirectory, "data");
export const resumeIndexDirectory = resolve(resumesBaseDirectory, "index");

export function getResumeDirectory(slug: string) {
  return resolve(resumeDataDirectory, slug);
}

export function getResumeFilePath(basePath: string) {
  return basePath + "/resume.json";
}

export function getResumeUploadPath(
  contentDirectory: string,
  slug: string,
  filename: string,
) {
  return join(contentDirectory, "uploads", "resume", slug, "uploads", filename);
}
