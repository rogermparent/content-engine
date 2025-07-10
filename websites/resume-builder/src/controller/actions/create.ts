"use server";

import parseResumeFormData from "../parseFormData";
import slugify from "@sindresorhus/slugify";
import { writeFile } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ResumeFormState } from "../formState";
import { Resume } from "../types";
import {
  getResumeDirectory,
  getResumeFilePath,
} from "../filesystemDirectories";
import getResumeDatabase from "../database";
import buildResumeIndexValue from "../buildIndexValue";
import createDefaultSlug from "../createSlug";
import { ensureDir } from "fs-extra";

export default async function createResume(
  _prevState: ResumeFormState,
  formData: FormData,
) {
  const validatedFields = parseResumeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to create Resume.",
    };
  }

  const {
    date: givenDate,
    slug: givenSlug,
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

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultSlug(validatedFields.data));
  const data: Resume = {
    company,
    job,
    date,
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
  };
  const resumeBaseDirectory = getResumeDirectory(slug);
  await ensureDir(resumeBaseDirectory);
  await writeFile(getResumeFilePath(resumeBaseDirectory), JSON.stringify(data));
  const db = getResumeDatabase();
  try {
    await db.put([date, slug], buildResumeIndexValue(data));
  } catch {
    return { message: "Failed to write resume" };
  } finally {
    db.close();
  }
  revalidatePath("/resume/" + slug);
  revalidatePath("/resumes");
  revalidatePath("/resumes/[page]", "page");
  revalidatePath("/");
  redirect("/resume/" + slug);
}
