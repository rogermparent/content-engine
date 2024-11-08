"use server";

import parseRecipeFormData from "../parseFormData";
import slugify from "@sindresorhus/slugify";
import { RecipeFormState } from "../formState";
import { Recipe } from "../types";
import createDefaultSlug from "../createSlug";
import {
  handleSuccess,
  processUploads,
  writeRecipeToFilesystem,
  writeRecipeToIndex,
} from "./common";
import { commitContentChanges } from "content-engine/git/commit";

// Main createRecipe function to orchestrate the process
export default async function createRecipe(
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
