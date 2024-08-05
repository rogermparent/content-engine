import { readFile } from "fs/promises";
import {
  getRecipeDirectory,
  getRecipeFilePath,
} from "../filesystemDirectories";
import { Recipe } from "../types";

export default async function getRecipeBySlug(slug: string): Promise<Recipe> {
  const recipeData = JSON.parse(
    String(await readFile(getRecipeFilePath(getRecipeDirectory(slug)))),
  );
  return recipeData;
}
