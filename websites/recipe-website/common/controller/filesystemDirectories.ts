import { resolve, join } from "path";

import { contentDirectory } from "content-engine/fs/getContentDirectory";

export const recipesBaseDirectory = resolve(contentDirectory, "recipes");

export const recipeDataDirectory = resolve(recipesBaseDirectory, "data");
export const recipeIndexDirectory = resolve(recipesBaseDirectory, "index");

export function getRecipeDirectory(slug: string) {
  return resolve(recipeDataDirectory, slug);
}

export function getRecipeFilePath(basePath: string) {
  return basePath + "/recipe.json";
}

export function getRecipeUploadPath(
  contentDirectory: string,
  slug: string,
  filename: string,
) {
  return join(contentDirectory, "uploads", "recipe", slug, "uploads", filename);
}
