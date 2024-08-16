"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parseResumeFormData from "../parseFormData";
import { ResumeFormState } from "../formState";
import { getResumeDirectory } from "../filesystemDirectories";
import { Resume } from "../types";
import getResumeDatabase from "../database";
import buildResumeIndexValue from "../buildIndexValue";
import createDefaultSlug from "../createSlug";
import slugify from "@sindresorhus/slugify";
import writeResumeFiles, { getResumeFileInfo } from "../writeUpload";
import getResumeBySlug from "../data/read";
import updateContentFile from "content-engine/fs/updateContentFile";
import { commitContentChanges } from "content-engine/git/commit";

async function updateDatabase(
  currentDate: number,
  currentSlug: string,
  finalDate: number,
  finalSlug: string,
  data: Resume,
) {
  const db = getResumeDatabase();
  try {
    const willRename = currentSlug !== finalSlug;
    const willChangeDate = currentDate !== finalDate;

    if (willRename || willChangeDate) {
      db.remove([currentDate, currentSlug]);
    }
    db.put([finalDate, finalSlug], buildResumeIndexValue(data));
  } catch {
    throw new Error("Failed to write resume to index");
  } finally {
    db.close();
  }
}

export default async function updateResume(
  currentDate: number,
  currentSlug: string,
  _prevState: ResumeFormState,
  formData: FormData,
) {
  const validatedFields = parseResumeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update Resume.",
    };
  }

  const {
    date,
    slug,
    name,
    description,
    ingredients,
    instructions,
    clearImage,
  } = validatedFields.data;

  const currentResumeDirectory = getResumeDirectory(currentSlug);
  const currentResumeData = await getResumeBySlug(currentSlug);

  const finalSlug = slugify(slug || createDefaultSlug(validatedFields.data));
  const finalDate = date || currentDate || Date.now();
  const finalResumeDirectory = getResumeDirectory(finalSlug);

  const imageData = await getResumeFileInfo(
    validatedFields.data,
    currentResumeData,
  );
  const imageName = imageData?.imageName;

  const data: Resume = {
    name,
    description,
    ingredients,
    instructions,
    video: currentResumeData.video,
    image: imageName || (clearImage ? undefined : currentResumeData.image),
    date: finalDate,
  };

  await updateContentFile({
    baseDirectory: finalResumeDirectory,
    currentBaseDirectory: currentResumeDirectory,
    filename: "resume.json",
    data,
  });

  if (imageData) {
    await writeResumeFiles(finalSlug, imageData);
  }

  await updateDatabase(currentDate, currentSlug, finalDate, finalSlug, data);
  await commitContentChanges(`Update resume: ${finalSlug}`);

  if (currentSlug !== finalSlug) {
    revalidatePath("/resume/" + currentSlug);
  }
  revalidatePath("/resume/" + finalSlug);
  revalidatePath("/");
  redirect("/resume/" + finalSlug);
}
