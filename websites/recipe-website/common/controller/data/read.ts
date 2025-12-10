import { readContentFile } from "content-engine/content/readContentFile";
import { readContentIndex } from "content-engine/content/readContentIndex";
import { recipeContentConfig } from "../recipeContentConfig";
import { Recipe, RecipeEntryKey, RecipeEntryValue } from "../types";

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
  return readContentFile<Recipe, RecipeEntryValue, RecipeEntryKey>({
    config: recipeContentConfig,
    slug,
    contentDirectory,
  });
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
  const result = await readContentIndex<
    Recipe,
    RecipeEntryValue,
    RecipeEntryKey
  >({
    config: recipeContentConfig,
    limit,
    offset,
    reverse: true,
    contentDirectory,
  });

  const recipes = result.entries.map(
    ({ key: [date, slug], value: { name, ingredients, image } }) => ({
      date,
      slug,
      name,
      ingredients,
      image,
    }),
  );

  return { recipes, more: result.more };
}
