import { readContentFile } from "@discontent/cms/content/readContentFile";
import { readContentIndex } from "@discontent/cms/content/readContentIndex";
import { featuredRecipeContentConfig } from "../featuredRecipeContentConfig";
import {
  FeaturedRecipe,
  FeaturedRecipeEntryKey,
  FeaturedRecipeEntryValue,
} from "../types";

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
    FeaturedRecipeEntryValue,
    FeaturedRecipeEntryKey,
    MassagedFeaturedRecipeEntry
  >({
    config: featuredRecipeContentConfig,
    limit,
    offset,
    reverse: true,
    contentDirectory,
    /*
     * One index read and nothing else. `recipeName` and `recipeImage` are
     * borrowed onto the index value at write time (§6.1), so what used to be
     * an N+1 — a `recipe.json` parse per card, per render, inside a `try` that
     * degraded silently to an unnamed imageless card — is now a projection.
     *
     * They stay optional here for the same reason they are optional on the
     * index value: a dangling reference is an ordinary state, and so is an
     * index written before these fields existed.
     */
    map: ({
      key: [date, slug],
      value: { recipe, note, recipeName, recipeImage },
    }) => ({
      date,
      slug,
      recipe,
      note,
      recipeName,
      recipeImage,
    }),
  });

  return { featuredRecipes: result.entries, more: result.more };
}
