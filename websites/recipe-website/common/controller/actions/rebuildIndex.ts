"use server";

import { readFile, readdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import getRecipeDatabase from "../database";
import {
  getRecipeDirectory,
  getRecipeFilePath,
  recipeDataDirectory,
} from "../filesystemDirectories";
import { Recipe } from "../types";
import buildRecipeIndexValue from "../buildIndexValue";

export default async function rebuildRecipeIndex() {
  const db = getRecipeDatabase();
  await db.drop();
  try {
    const recipeDirectories = await readdir(recipeDataDirectory);
    for (const slug of recipeDirectories) {
      const recipeFilePath = getRecipeFilePath(getRecipeDirectory(slug));
      const recipeFileContents = JSON.parse(
        String(await readFile(recipeFilePath)),
      );
      const { date } = recipeFileContents as Recipe;
      await db.put([date, slug], buildRecipeIndexValue(recipeFileContents));
    }
  } catch (e) {}
  db.close();
  revalidatePath("/");
}
