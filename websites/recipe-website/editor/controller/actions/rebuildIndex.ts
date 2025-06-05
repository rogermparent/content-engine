"use server";

import { readFile, readdir, exists } from "fs-extra";
import { revalidatePath } from "next/cache";
import getRecipeDatabase from "recipe-website-common/controller/database";
import {
  getRecipeDirectory,
  getRecipeFilePath,
  recipeDataDirectory,
} from "recipe-website-common/controller/filesystemDirectories";
import { Recipe } from "recipe-website-common/controller/types";
import buildRecipeIndexValue from "recipe-website-common/controller/buildIndexValue";

export default async function rebuildRecipeIndex() {
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
