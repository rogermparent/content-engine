"use server";

import parseResumeFormData from "../parseFormData";
import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ResumeFormState } from "../formState";
import { Resume } from "../types";
import { getResumeDirectory } from "../filesystemDirectories";
import getResumeDatabase from "../database";
import buildResumeIndexValue from "../buildIndexValue";
import createDefaultSlug from "../createSlug";
import writeResumeFiles, {
  getResumeFileInfo,
  ResumeImageData,
} from "../writeUpload";
import { outputJson } from "fs-extra";
import { join } from "path";
import { commitContentChanges } from "content-engine/git/commit";

async function writeResumeToIndex(data: Resume, date: number, slug: string) {
  const db = getResumeDatabase();
  try {
    await db.put([date, slug], buildResumeIndexValue(data));
  } catch {
    throw new Error("Failed to write resume to index");
  } finally {
    db.close();
  }
}

async function writeResumeToFilesystem(
  slug: string,
  data: Resume,
  imageData: ResumeImageData | undefined,
) {
  const baseDirectory = getResumeDirectory(slug);

  await outputJson(join(baseDirectory, "resume.json"), data);

  if (imageData) {
    await writeResumeFiles(slug, imageData);
  }
}

export default async function createResume(
  _prevState: ResumeFormState,
  formData: FormData,
) {
  const validatedFields = parseResumeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Resume is invalid",
    };
  }

  const {
    date: givenDate,
    slug: givenSlug,
    name,
    description,
    ingredients,
    instructions,
  } = validatedFields.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultSlug(validatedFields.data));

  const imageData = await getResumeFileInfo(validatedFields.data);
  const imageName = imageData?.imageName;

  const data: Resume = {
    name,
    description,
    ingredients,
    instructions,
    image: imageName,
    date,
  };

  try {
    await writeResumeToFilesystem(slug, data, imageData);
  } catch {
    return { message: "Failed to write resume files" };
  }

  try {
    writeResumeToIndex(data, date, slug);
  } catch {
    return { message: "Failed to write resume to LMDB index" };
  }

  try {
    await commitContentChanges(`Add new resume: ${slug}`);
  } catch {
    return { message: "Failed to commit content changes to Git" };
  }

  revalidatePath("/resume/" + slug);
  revalidatePath("/resumes");
  revalidatePath("/resumes/[page]", "page");
  revalidatePath("/");
  redirect("/resume/" + slug);
}
