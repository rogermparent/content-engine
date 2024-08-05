"use server";

import parseRecipeFormData from "../parseFormData";
import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RecipeFormState } from "../formState";
import { Recipe } from "../types";
import { getRecipeDirectory } from "../filesystemDirectories";
import getRecipeDatabase from "../database";
import buildRecipeIndexValue from "../buildIndexValue";
import createDefaultSlug from "../createSlug";
import writeRecipeFiles, {
  getRecipeFileInfo,
  RecipeImageData,
} from "../writeUpload";
import { outputJson } from "fs-extra";
import { join } from "path";
import { commitContentChanges } from "content-engine/git/commit";

async function writeRecipeToIndex(data: Recipe, date: number, slug: string) {
  const db = getRecipeDatabase();
  try {
    await db.put([date, slug], buildRecipeIndexValue(data));
  } catch {
    throw new Error("Failed to write recipe to index");
  } finally {
    db.close();
  }
}

async function writeRecipeToFilesystem(
  slug: string,
  data: Recipe,
  imageData: RecipeImageData | undefined,
) {
  const baseDirectory = getRecipeDirectory(slug);

  await outputJson(join(baseDirectory, "recipe.json"), data);

  if (imageData) {
    await writeRecipeFiles(slug, imageData);
  }
}

export default async function createRecipe(
  _prevState: RecipeFormState,
  formData: FormData,
) {
  const validatedFields = parseRecipeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Recipe is invalid",
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

  const imageData = await getRecipeFileInfo(validatedFields.data);
  const imageName = imageData?.imageName;

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageName,
    date,
  };

  try {
    await writeRecipeToFilesystem(slug, data, imageData);
  } catch {
    return { message: "Failed to write recipe files" };
  }

  try {
    writeRecipeToIndex(data, date, slug);
  } catch {
    return { message: "Failed to write recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Add new recipe: ${slug}`);
  } catch {
    return { message: "Failed to commit content changes to Git" };
  }

  revalidatePath("/recipe/" + slug);
  revalidatePath("/recipes");
  revalidatePath("/recipes/[page]", "page");
  revalidatePath("/");
  redirect("/recipe/" + slug);
}
