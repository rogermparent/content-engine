"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parseRecipeFormData from "../parseFormData";
import { RecipeFormState } from "../formState";
import { getRecipeDirectory } from "../filesystemDirectories";
import { Recipe } from "../types";
import getRecipeDatabase from "../database";
import buildRecipeIndexValue from "../buildIndexValue";
import createDefaultSlug from "../createSlug";
import slugify from "@sindresorhus/slugify";
import writeRecipeFiles, { getUploadInfo } from "../writeUpload";
import getRecipeBySlug from "../data/read";
import updateContentFile from "content-engine/fs/updateContentFile";
import { commitContentChanges } from "content-engine/git/commit";

async function updateDatabase(
  currentDate: number,
  currentSlug: string,
  finalDate: number,
  finalSlug: string,
  data: Recipe,
) {
  const db = getRecipeDatabase();
  try {
    const willRename = currentSlug !== finalSlug;
    const willChangeDate = currentDate !== finalDate;

    if (willRename || willChangeDate) {
      db.remove([currentDate, currentSlug]);
    }
    db.put([finalDate, finalSlug], buildRecipeIndexValue(data));
  } catch {
    throw new Error("Failed to write recipe to index");
  } finally {
    db.close();
  }
}

export default async function updateRecipe(
  currentDate: number,
  currentSlug: string,
  _prevState: RecipeFormState,
  formData: FormData,
) {
  const validatedFields = parseRecipeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update Recipe.",
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
    image,
    video,
    clearVideo,
    imageImportUrl,
  } = validatedFields.data;

  const currentRecipeDirectory = getRecipeDirectory(currentSlug);
  const currentRecipeData = await getRecipeBySlug(currentSlug);

  const finalSlug = slugify(slug || createDefaultSlug(validatedFields.data));
  const finalDate = date || currentDate || Date.now();
  const finalRecipeDirectory = getRecipeDirectory(finalSlug);

  const imageData = await getUploadInfo({
    file: image,
    clearFile: clearImage,
    existingFile: currentRecipeData?.image,
    fileImportUrl: imageImportUrl,
  });
  const imageName = imageData?.fileName;

  const videoData = await getUploadInfo({
    file: video,
    clearFile: clearVideo,
    existingFile: currentRecipeData?.video,
  });
  const videoName = videoData?.fileName;

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    video: videoName,
    image: imageName,
    date: finalDate,
  };

  await updateContentFile({
    baseDirectory: finalRecipeDirectory,
    currentBaseDirectory: currentRecipeDirectory,
    filename: "recipe.json",
    data,
  });

  if (imageData) {
    await writeRecipeFiles(finalSlug, imageData);
  }

  if (videoData) {
    await writeRecipeFiles(finalSlug, videoData);
  }

  await updateDatabase(currentDate, currentSlug, finalDate, finalSlug, data);
  await commitContentChanges(`Update recipe: ${finalSlug}`);

  if (currentSlug !== finalSlug) {
    revalidatePath("/recipe/" + currentSlug);
  }
  revalidatePath("/recipe/" + finalSlug);
  revalidatePath("/");
  redirect("/recipe/" + finalSlug);
}
