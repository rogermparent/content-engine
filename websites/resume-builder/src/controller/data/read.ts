import { readJson } from "fs-extra";
import {
  getResumeDirectory,
  getResumeFilePath,
} from "../filesystemDirectories";
import { Resume } from "../types";

export default async function getResumeBySlug(slug: string): Promise<Resume> {
  return readJson(getResumeFilePath(getResumeDirectory(slug)));
}
