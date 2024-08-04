"use server";

import { rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import getRecipeDatabase from "../database";
import { getRecipeDirectory } from "../filesystemDirectories";
import { commitContentChanges } from "content-engine/git/commit";

async function removeFromDatabase(date: number, slug: string) {
  const db = getRecipeDatabase();
  try {
    await db.remove([date, slug]);
  } catch (e) {
    throw new Error("Failed to remove recipe from index");
  } finally {
    db.close();
  }
}

export default async function deleteRecipe(date: number, slug: string) {
  const recipeDirectory = getRecipeDirectory(slug);
  try {
    await rm(recipeDirectory, { recursive: true });

    await Promise.all([
      removeFromDatabase(date, slug),
      commitContentChanges(`Delete recipe: ${slug}`),
    ]);

    revalidatePath("/recipe/" + slug);
    revalidatePath("/");
    redirect("/");
  } catch (e) {
    throw e;
  }
}
