import { readContentIndex } from "content-engine/content/readContentIndex";
import { resumeContentConfig } from "../resumeContentConfig";
import type { ResumeEntry, ResumeEntryKey, ResumeEntryValue } from "../types";

export interface ReadResumeIndexResult {
  resumes: ResumeEntry[];
  more: boolean;
}

export default async function getResumes({
  limit,
  offset,
}: { limit?: number; offset?: number } = {}): Promise<ReadResumeIndexResult> {
  const { entries, more } = await readContentIndex<
    ResumeEntryValue,
    ResumeEntryKey,
    ResumeEntry
  >({
    config: resumeContentConfig,
    limit,
    offset,
    reverse: true,
    map: ({ key, value }) => ({ key, value }),
  });
  return { resumes: entries, more };
}
