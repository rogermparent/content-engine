import { resolve, join } from "path";

import { getContentDirectory } from "content-engine/fs/getContentDirectory";

export function getRecipesBaseDirectory(providedContentDirectory?: string) {
  return resolve(providedContentDirectory || getContentDirectory(), "recipes");
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

export function getRecipeUploadsBasePath(
  contentDirectory: string,
  slug: string,
) {
  return join(contentDirectory, "uploads", "recipe", slug);
}

export function getRecipeUploadsPath(contentDirectory: string, slug: string) {
  return join(getRecipeUploadsBasePath(contentDirectory, slug), "uploads");
}

export function getRecipeUploadPath(
  contentDirectory: string,
  slug: string,
  filename: string,
) {
  return join(getRecipeUploadsPath(contentDirectory, slug), filename);
}

export function getFeaturedRecipesBaseDirectory(providedContentDirectory?: string) {
  return resolve(providedContentDirectory || getContentDirectory(), "featured-recipes");
}

export function getFeaturedRecipeDataDirectory(providedContentDirectory?: string) {
  return resolve(getFeaturedRecipesBaseDirectory(providedContentDirectory), "data");
}

export function getFeaturedRecipeIndexDirectory(providedContentDirectory?: string) {
  return resolve(getFeaturedRecipesBaseDirectory(providedContentDirectory), "index");
}

export function getFeaturedRecipeDirectory(
  slug: string,
  providedContentDirectory?: string,
) {
  return resolve(getFeaturedRecipeDataDirectory(providedContentDirectory), slug);
}

export function getFeaturedRecipeFilePath(basePath: string) {
  return basePath + "/featured-recipe.json";
}
