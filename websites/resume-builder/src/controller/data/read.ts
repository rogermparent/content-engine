import { readFile } from "fs-extra";
import {
  getResumeDirectory,
  getResumeFilePath,
} from "../filesystemDirectories";
import { Resume } from "../types";

export default async function getResumeBySlug(slug: string): Promise<Resume> {
  const resumeData = JSON.parse(
    String(await readFile(getResumeFilePath(getResumeDirectory(slug)))),
  );
  return resumeData;
}
