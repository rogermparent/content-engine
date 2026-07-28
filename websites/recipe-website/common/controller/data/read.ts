import { readContentFile } from "@discontent/cms/content/readContentFile";
import { readContentIndex } from "@discontent/cms/content/readContentIndex";
import { recipeContentConfig } from "../recipeContentConfig";
import { Recipe, RecipeEntryKey, RecipeEntryValue } from "../types";

export type MassagedRecipeEntry = {
  date: number;
  slug: string;
  name: string;
  /** Flattened, truncated recipe description — indexed and shown as a search snippet. */
  description?: string;
  ingredients?: string[];
  image?: string;
  tags?: string[];
  /** Minutes, for the search query language's `time:` filter. */
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
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
    RecipeEntryValue,
    RecipeEntryKey,
    MassagedRecipeEntry
  >({
    config: recipeContentConfig,
    limit,
    offset,
    reverse: true,
    contentDirectory,
    map: ({
      key: [date, slug],
      value: {
        name,
        description,
        ingredients,
        image,
        tags,
        prepTime,
        cookTime,
        totalTime,
      },
    }) => ({
      date,
      slug,
      name,
      description,
      ingredients,
      image,
      tags,
      prepTime,
      cookTime,
      totalTime,
    }),
  });

  const recipes = result.entries;

  return { recipes, more: result.more };
}

/**
 * The unique set of tags across the whole corpus, sorted alphabetically —
 * feeds the tag suggestions in the recipe form. Reads the index (not the
 * content files), so it stays cheap.
 */
export async function getAllTags({
  contentDirectory,
}: {
  contentDirectory?: string;
} = {}): Promise<string[]> {
  const { recipes } = await getRecipes({ contentDirectory });
  const set = new Set<string>();
  for (const recipe of recipes) {
    if (recipe.tags) {
      for (const tag of recipe.tags) set.add(tag);
    }
  }
  return Array.from(set).sort();
}
