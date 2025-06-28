import { readFile } from "fs-extra";
import {
  getRecipeDirectory,
  getRecipeFilePath,
} from "../filesystemDirectories";
import { Recipe } from "../types";

import getRecipeDatabase from "../database";

export type MassagedRecipeEntry = {
  date: number;
  slug: string;
  name: string;
  ingredients?: string[];
  image?: string;
};

export interface ReadRecipeIndexResult {
  recipes: MassagedRecipeEntry[];
  more: boolean;
}

export async function getRecipeBySlug({
  slug,
  contentDirectory,
}: {
  slug: string;
  contentDirectory?: string;
}): Promise<Recipe> {
  const recipeData = JSON.parse(
    String(
      await readFile(
        getRecipeFilePath(getRecipeDirectory(slug, contentDirectory)),
      ),
    ),
  );
  return recipeData;
}

export async function getRecipes({
  limit,
  offset,
  contentDirectory,
}: {
  limit?: number;
  offset?: number;
  contentDirectory?: string;
} = {}): Promise<ReadRecipeIndexResult> {
  const db = getRecipeDatabase(contentDirectory);
  const recipes = db
    .getRange({ limit, offset, reverse: true })
    .map(({ key: [date, slug], value: { name, ingredients, image } }) => ({
      date,
      slug,
      name,
      ingredients,
      image,
    })).asArray;
  const totalRecipes = db.getCount();
  const more = (offset || 0) + (limit || 0) < totalRecipes;
  db.close();
  return { recipes, more };
}
