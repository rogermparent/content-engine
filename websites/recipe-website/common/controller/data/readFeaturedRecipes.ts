import { readFile } from "fs-extra";
import {
  getFeaturedRecipeDirectory,
  getFeaturedRecipeFilePath,
} from "../filesystemDirectories";
import { FeaturedRecipe } from "../types";
import { getRecipeBySlug } from "./read";
import getFeaturedRecipeDatabase from "../featuredRecipeDatabase";

export type MassagedFeaturedRecipeEntry = {
  date: number;
  slug: string;
  recipe: string;
  note?: string;
  recipeName?: string;
  recipeImage?: string;
};

export interface ReadFeaturedRecipeIndexResult {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
  more: boolean;
}

export async function getFeaturedRecipeBySlug({
  slug,
  contentDirectory,
}: {
  slug: string;
  contentDirectory?: string;
}): Promise<FeaturedRecipe> {
  const featuredRecipeData = JSON.parse(
    String(
      await readFile(
        getFeaturedRecipeFilePath(
          getFeaturedRecipeDirectory(slug, contentDirectory),
        ),
      ),
    ),
  );
  return featuredRecipeData;
}

export async function getFeaturedRecipes({
  limit,
  offset,
  contentDirectory,
}: {
  limit?: number;
  offset?: number;
  contentDirectory?: string;
} = {}): Promise<ReadFeaturedRecipeIndexResult> {
  const db = getFeaturedRecipeDatabase(contentDirectory);
  const featuredRecipes = db
    .getRange({ limit, offset, reverse: true })
    .map(({ key: [date, slug], value: { recipe, note } }) => ({
      date,
      slug,
      recipe,
      note,
    })).asArray;

  // Enrich with recipe data
  const enrichedFeaturedRecipes = await Promise.all(
    featuredRecipes.map(async (entry) => {
      try {
        const recipeData = await getRecipeBySlug({
          slug: entry.recipe,
          contentDirectory,
        });
        return {
          ...entry,
          recipeName: recipeData.name,
          recipeImage: recipeData.image,
        };
      } catch {
        return entry;
      }
    }),
  );

  const totalFeaturedRecipes = db.getCount();
  const more = (offset || 0) + (limit || 0) < totalFeaturedRecipes;
  db.close();
  return { featuredRecipes: enrichedFeaturedRecipes, more };
}

