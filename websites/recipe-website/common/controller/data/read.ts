import { readContentFile } from "@discontent/cms/content/readContentFile";
import { readContentIndex } from "@discontent/cms/content/readContentIndex";
import { recipeContentConfig } from "../recipeContentConfig";
import { Recipe, RecipeEntryKey, RecipeEntryValue } from "../types";
import { recipeTagReads } from "./readRecipeTags";

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

/**
 * The raw, uncached read of a recipe's data file. Throws ENOENT when there is
 * none.
 *
 * **Rendering code wants `recipeItems.read(slug)` instead** — cached, tagged
 * `item:recipes:<slug>`, and `null` rather than a throw for a missing recipe.
 * This one survives for the write path, which must not read through a cache:
 * `buildUpdateData` reads the current record to carry `image` and `video`
 * forward, and a stale read there would write the stale values back to disk.
 * It also takes `contentDirectory`, which a module-scope cached read cannot.
 *
 * The same split F10c used for `getAllTags`.
 */
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
 * feeds the homepage's browse chips and the tag suggestions in the three
 * recipe forms.
 *
 * One O(1) key read of a value folded at write time, where this used to load
 * every recipe in the corpus and build a `Set` on **every render of every one
 * of those four surfaces**. It is also the last untagged reader on the
 * homepage: the strips moved onto the keyspace in F10a, and this closes it.
 *
 * `contentDirectory` is gone rather than ignored. The cached read binds the
 * directory at module scope — it has to, since it is also part of the cache
 * key — and every one of the four call sites already passed nothing. A
 * parameter that silently did not work would be worse than not having one;
 * anything needing a different directory should call `readAggregate` with it.
 *
 * `null` means the aggregate has never been folded — an unbuilt content
 * directory, or a fixture captured before recipes declared this. It reads as
 * no tags, which is what the corpus looked like to the previous
 * implementation too when the index was empty.
 */
export async function getAllTags(): Promise<string[]> {
  return (await recipeTagReads.read()) ?? [];
}
