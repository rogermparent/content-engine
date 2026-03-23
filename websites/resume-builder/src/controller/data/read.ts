import { readContentFile } from "@discontent/cms/content/readContentFile";
import { resumeContentConfig } from "../resumeContentConfig";
import type { Resume, ResumeEntryKey, ResumeEntryValue } from "../types";

export default async function getResumeBySlug(slug: string): Promise<Resume> {
  return readContentFile<Resume, ResumeEntryValue, ResumeEntryKey>({
    config: resumeContentConfig,
    slug,
  });
}
