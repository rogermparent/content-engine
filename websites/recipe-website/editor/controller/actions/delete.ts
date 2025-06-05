"use server";

import { rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import getRecipeDatabase from "recipe-website-common/controller/database";
import { getRecipeDirectory } from "recipe-website-common/controller/filesystemDirectories";
import { commitContentChanges } from "content-engine/git/commit";

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

export default async function deleteRecipe(date: number, slug: string) {
  const recipeDirectory = getRecipeDirectory(slug);
  await rm(recipeDirectory, { recursive: true });

  await removeFromDatabase(date, slug);
  await commitContentChanges(`Delete recipe: ${slug}`);

  revalidatePath("/recipe/" + slug);
  revalidatePath("/");
  redirect("/");
}
