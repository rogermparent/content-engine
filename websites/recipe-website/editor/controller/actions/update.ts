"use server";

import parseRecipeFormData from "../parseFormData";
import { RecipeFormState } from "../formState";
import { Recipe } from "recipe-website-common/controller/types";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import slugify from "@sindresorhus/slugify";
import getRecipeBySlug from "recipe-website-common/controller/data/read";
import { commitContentChanges } from "content-engine/git/commit";
import {
  handleSuccess,
  processUploads,
  writeRecipeToFilesystem,
  writeRecipeToIndex,
} from "./common";

export default async function updateRecipe(
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
