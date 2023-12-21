import  getResumeDatabase  from "../database";
import { ResumeEntry } from "../types";

export default async function getResumes({
  limit,
  offset,
}: { limit?: number; offset?: number } = {}): Promise<{
  resumes: ResumeEntry[];
  more: boolean;
}> {
  const db = getResumeDatabase();
  const resumes = db.getRange({ limit, offset, reverse: true }).asArray;
  const totalResumes = db.getCount();
  const more = (offset || 0) + (limit || 0) < totalResumes;
  db.close();
  return { resumes, more };
}
