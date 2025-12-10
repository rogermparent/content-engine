import { readContentFile } from "content-engine/content/readContentFile";
import { readContentIndex } from "content-engine/content/readContentIndex";
import { featuredRecipeContentConfig } from "../featuredRecipeContentConfig";
import {
  FeaturedRecipe,
  FeaturedRecipeEntryKey,
  FeaturedRecipeEntryValue,
} from "../types";
import { getRecipeBySlug } from "./read";

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
  return readContentFile({
    config: featuredRecipeContentConfig,
    slug,
    contentDirectory,
  });
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
  const result = await readContentIndex<
    FeaturedRecipe,
    FeaturedRecipeEntryValue,
    FeaturedRecipeEntryKey
  >({
    config: featuredRecipeContentConfig,
    limit,
    offset,
    reverse: true,
    contentDirectory,
  });

  const featuredRecipes = result.entries.map(
    ({ key: [date, slug], value: { recipe, note } }) => ({
      date,
      slug,
      recipe,
      note,
    }),
  );

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

  return { featuredRecipes: enrichedFeaturedRecipes, more: result.more };
}

