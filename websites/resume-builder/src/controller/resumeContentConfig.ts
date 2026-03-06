import type { ContentTypeConfig } from "content-engine/content/types";
import type { Resume, ResumeEntryKey, ResumeEntryValue } from "./types";
import buildResumeIndexValue from "./buildIndexValue";
import createDefaultSlug from "./createSlug";

export const resumeContentConfig: ContentTypeConfig<
  Resume,
  ResumeEntryValue,
  ResumeEntryKey
> = {
  contentType: "resume",
  dataDirectory: "resumes/data",
  indexDirectory: "resumes/index",
  dataFilename: "resume.json",
  buildIndexValue: buildResumeIndexValue,
  buildIndexKey: (slug: string, data: Resume): ResumeEntryKey => [data.date, slug],
  createDefaultSlug: (data: Resume) =>
    createDefaultSlug({ company: data.company, job: data.job }),
};
