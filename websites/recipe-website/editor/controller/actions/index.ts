"use server";

import slugify from "@sindresorhus/slugify";
import { commitContentChanges } from "content-engine/git/commit";
import { exists, readFile, readdir } from "fs-extra";
import { rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import buildRecipeIndexValue from "recipe-website-common/controller/buildIndexValue";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import getRecipeBySlug from "recipe-website-common/controller/data/read";
import getRecipeDatabase from "recipe-website-common/controller/database";
import {
  getRecipeDirectory,
  getRecipeFilePath,
  recipeDataDirectory,
} from "recipe-website-common/controller/filesystemDirectories";
import { Recipe } from "recipe-website-common/controller/types";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import parseRecipeFormData from "../parseFormData";
import {
  handleSuccess,
  processUploads,
  writeRecipeToFilesystem,
  writeRecipeToIndex,
} from "./common";

export async function rebuildRecipeIndex() {
  const db = getRecipeDatabase();
  await db.drop();
  if (await exists(recipeDataDirectory)) {
    const recipeDirectories = await readdir(recipeDataDirectory);
    for (const slug of recipeDirectories) {
      const recipeFilePath = getRecipeFilePath(getRecipeDirectory(slug));
      const recipeFileContents = JSON.parse(
        String(await readFile(recipeFilePath)),
      );
      const { date } = recipeFileContents as Recipe;
      await db.put([date, slug], buildRecipeIndexValue(recipeFileContents));
    }
  }
  db.close();
  revalidatePath("/");
}

export async function updateRecipe(
  currentDate: number,
  currentSlug: string,
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const formResult = parseRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: formResult.error.flatten().fieldErrors,
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
    prepTime,
    cookTime,
    totalTime,
  } = formResult.data;

  const currentRecipeData = await getRecipeBySlug(currentSlug);

  const finalSlug = slugify(slug || createDefaultSlug(formResult.data));
  const finalDate = date || currentDate || Date.now();

  const { imageData, videoData } = await processUploads({
    video,
    clearVideo,
    existingVideo: currentRecipeData?.video,
    image,
    clearImage,
    existingImage: currentRecipeData?.image,
  });

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageData?.fileName,
    video: videoData?.fileName,
    date: finalDate,
    prepTime,
    cookTime,
    totalTime,
  };

  try {
    await writeRecipeToFilesystem({
      slug: finalSlug,
      data,
      imageData,
      videoData,
      currentSlug,
    });
  } catch {
    return { message: "Failed to write recipe files" };
  }

  try {
    await writeRecipeToIndex(
      data,
      finalDate,
      finalSlug,
      currentDate,
      currentSlug,
    );
  } catch {
    return { message: "Failed to write recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Update recipe: ${finalSlug}`);
  } catch {
    return { message: "Failed to commit content changes to Git" };
  }

  handleSuccess(finalSlug, currentSlug);

  return { message: "Recipe update successful!" };
}
// Main createRecipe function to orchestrate the process
export async function createRecipe(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const formResult = parseRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: formResult.error.flatten().fieldErrors,
      message: "Error parsing recipe",
    };
  }

  const {
    date: givenDate,
    slug: givenSlug,
    name,
    description,
    ingredients,
    instructions,
    image,
    clearImage,
    video,
    clearVideo,
    imageImportUrl,
    prepTime,
    cookTime,
    totalTime,
  } = formResult.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultSlug(formResult.data));

  const { imageData, videoData } = await processUploads({
    image,
    clearImage,
    video,
    clearVideo,
    imageImportUrl,
  });

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageData?.fileName,
    video: videoData?.fileName,
    date,
    prepTime,
    cookTime,
    totalTime,
  };

  try {
    await writeRecipeToFilesystem({ slug, data, imageData, videoData });
  } catch {
    return { message: "Failed to write recipe files" };
  }

  try {
    await writeRecipeToIndex(data, date, slug);
  } catch {
    return { message: "Failed to write recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Add new recipe: ${slug}`);
  } catch {
    return { message: "Failed to commit content changes to Git" };
  }

  handleSuccess(slug);

  return { message: "Recipe creation successful!" };
}

async function removeFromDatabase(date: number, slug: string) {
  const db = getRecipeDatabase();
  try {
    await db.remove([date, slug]);
  } catch {
    throw new Error("Failed to remove recipe from index");
  } finally {
    db.close();
  }
}

export async function deleteRecipe(date: number, slug: string) {
  const recipeDirectory = getRecipeDirectory(slug);
  await rm(recipeDirectory, { recursive: true });

  await removeFromDatabase(date, slug);
  await commitContentChanges(`Delete recipe: ${slug}`);

  revalidatePath("/recipe/" + slug);
  revalidatePath("/");
  redirect("/");
}
