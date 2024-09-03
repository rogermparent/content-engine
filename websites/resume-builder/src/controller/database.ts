import { open } from "lmdb";
import { resumeIndexDirectory } from "./filesystemDirectories";
import { ResumeEntryKey, ResumeEntryValue } from "./types";

export default function getResumeDatabase() {
  return open<ResumeEntryValue, ResumeEntryKey>({
    path: resumeIndexDirectory,
  });
}
