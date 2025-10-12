"use server";

import { rename, writeFile } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parseResumeFormData from "../parseFormData";
import { ResumeFormState } from "../formState";
import {
  getResumeDirectory,
  getResumeFilePath,
} from "../filesystemDirectories";
import { Resume } from "../types";
import getResumeDatabase from "../database";
import buildResumeIndexValue from "../buildIndexValue";
import createDefaultSlug from "../createSlug";
import z from "zod";

export default async function updateResume(
  currentDate: number,
  currentSlug: string,
  _prevState: ResumeFormState,
  formData: FormData,
) {
  const validatedFields = parseResumeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: "Failed to update Resume.",
    };
  }

  const {
    date,
    slug,
    company,
    job,
    address,
    email,
    github,
    linkedin,
    name,
    phone,
    skills,
    website,
    education,
    experience,
    projects,
  } = validatedFields.data;

  const currentResumeDirectory = getResumeDirectory(currentSlug);
  const currentResumePath = getResumeFilePath(currentResumeDirectory);

  const finalSlug = slug || createDefaultSlug(validatedFields.data);
  const finalDate = date || currentDate;
  const finalResumeDirectory = getResumeDirectory(finalSlug);

  const willRename = currentResumeDirectory !== finalResumeDirectory;
  const willChangeDate = date && currentDate !== date;

  const data: Resume = {
    company,
    job,
    date: finalDate,
    address,
    email,
    github,
    linkedin,
    education,
    experience,
    name,
    phone,
    projects,
    skills,
    website,
  };

  if (willRename) {
    await rename(currentResumeDirectory, finalResumeDirectory);
    await writeFile(
      `${finalResumeDirectory}/resume.json`,
      JSON.stringify(data),
    );
  } else {
    await writeFile(currentResumePath, JSON.stringify(data));
  }

  const db = getResumeDatabase();

  try {
    if (willRename || willChangeDate) {
      db.remove([currentDate, currentSlug]);
    }
    db.put([finalDate, finalSlug], buildResumeIndexValue(data));
  } catch {
    return { message: "Failed to write resume to index" };
  } finally {
    db.close();
  }
  if (willRename) {
    revalidatePath("/resume/" + currentSlug);
  }
  revalidatePath("/resume/" + finalSlug);
  revalidatePath("/");
  redirect("/resume/" + finalSlug);
}
