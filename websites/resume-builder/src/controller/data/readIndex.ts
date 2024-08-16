import getResumeDatabase from "../database";

export interface MassagedResumeEntry {
  date: number;
  slug: string;
  name: string;
  ingredients?: string[];
  image?: string;
}

export interface ReadResumeIndexResult {
  resumes: MassagedResumeEntry[];
  more: boolean;
}

export default async function getResumes({
  limit,
  offset,
}: { limit?: number; offset?: number } = {}): Promise<ReadResumeIndexResult> {
  const db = getResumeDatabase();
  const resumes = db
    .getRange({ limit, offset, reverse: true })
    .map(({ key: [date, slug], value: { name, ingredients, image } }) => ({
      date,
      slug,
      name,
      ingredients,
      image,
    })).asArray;
  const totalResumes = db.getCount();
  const more = (offset || 0) + (limit || 0) < totalResumes;
  db.close();
  return { resumes, more };
}
