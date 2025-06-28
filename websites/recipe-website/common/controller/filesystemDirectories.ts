import { resolve, join } from "path";

import { contentDirectory } from "content-engine/fs/getContentDirectory";

export function getRecipesBaseDirectory(providedContentDirectory?: string) {
  return resolve(providedContentDirectory || contentDirectory, "recipes");
}

export function getRecipeDataDirectory(providedContentDirectory?: string) {
  return resolve(getRecipesBaseDirectory(providedContentDirectory), "data");
}

export function getRecipeIndexDirectory(providedContentDirectory?: string) {
  return resolve(getRecipesBaseDirectory(providedContentDirectory), "index");
}

export function getRecipeDirectory(
  slug: string,
  providedContentDirectory?: string,
) {
  return resolve(getRecipeDataDirectory(providedContentDirectory), slug);
}

export function getRecipeFilePath(basePath: string) {
  return basePath + "/recipe.json";
}

export function getRecipeUploadsPath(contentDirectory: string, slug: string) {
  return join(contentDirectory, "uploads", "recipe", slug, "uploads");
}

export function getRecipeUploadPath(
  contentDirectory: string,
  slug: string,
  filename: string,
) {
  return join(getRecipeUploadsPath(contentDirectory, slug), filename);
}
