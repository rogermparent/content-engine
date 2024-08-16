"use server";

import { readFile, readdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import getResumeDatabase from "../database";
import {
  getResumeDirectory,
  getResumeFilePath,
  resumeDataDirectory,
} from "../filesystemDirectories";
import { Resume } from "../types";
import buildResumeIndexValue from "../buildIndexValue";

export default async function rebuildResumeIndex() {
  const db = getResumeDatabase();
  await db.drop();
  const resumeDirectories = await readdir(resumeDataDirectory);
  for (const slug of resumeDirectories) {
    const resumeFilePath = getResumeFilePath(getResumeDirectory(slug));
    const resumeFileContents = JSON.parse(
      String(await readFile(resumeFilePath)),
    );
    const { date } = resumeFileContents as Resume;
    await db.put([date, slug], buildResumeIndexValue(resumeFileContents));
  }
  db.close();
  revalidatePath("/");
}
