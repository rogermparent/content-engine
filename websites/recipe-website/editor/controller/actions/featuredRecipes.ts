"use server";

import { rebuildIndex } from "@discontent/cms/content/rebuildIndex";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { revalidatePath, revalidateTag } from "next/cache";
import slugify from "@sindresorhus/slugify";
import createDefaultFeaturedRecipeSlug from "recipe-website-common/controller/createFeaturedRecipeSlug";
import { featuredRecipePages } from "recipe-website-common/controller/data/readFeaturedRecipePages";
import { featuredRecipeContentConfig } from "recipe-website-common/controller/featuredRecipeContentConfig";
import type { FeaturedRecipeFormState } from "recipe-website-common/controller/featuredRecipeFormState";
import type {
  FeaturedRecipe,
  FeaturedRecipeEntryKey,
} from "recipe-website-common/controller/types";
import { z } from "zod";
import parseFeaturedRecipeFormData, {
  ParsedFeaturedRecipeFormData,
} from "../parseFeaturedRecipeFormData";
import type { EditorContentConfig } from "@discontent/cms/content/editorContentConfig";
import { createGenericActions } from "@discontent/cms/content/genericActions";
import { authenticateUser } from "./shared";

const featuredRecipeEditorConfig: EditorContentConfig<
  FeaturedRecipe,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  FeaturedRecipeEntryKey,
  FeaturedRecipeFormState,
  ParsedFeaturedRecipeFormData
> = {
  contentConfig: featuredRecipeContentConfig,
  successConfig: {
    itemBasePath: "/featured-recipe",
    /*
     * Empty because `/featured-recipes` and `/featured-recipes/[page]` now read
     * through the pagination index, and `revalidatePaginationResults`
     * invalidates exactly the pages a write actually changed — where a blanket
     * `revalidatePath` dropped every sealed page on every feature.
     *
     * `paginationOnly` stays off for the reason spelled out at length on the
     * recipe config: the homepage's **hero** still reads a whole recipe data
     * file through `getRecipeBySlug` and has no tag to be told about. The
     * featured strip itself gained one in F10a — this is the last holdout, and
     * it belongs to neither type's list surfaces.
     *
     * Featured recipes matter to it because the hero *prefers* the newest
     * featured recipe: featuring something changes which recipe the hero
     * renders, not just what the strip lists.
     */
    listPaths: [],
    redirectTo: () => "/",
  },
  label: "featured recipe",
  // Auth is injected rather than imported: the factory lives in
  // @discontent/cms and cannot reach this app\'s `@/auth` alias. Required by
  // the type, so a content type cannot ship an unauthenticated write path.
  authenticate: authenticateUser,

  parseFormData(formData: FormData) {
    const formResult = parseFeaturedRecipeFormData(formData);
    if (!formResult.success) {
      return {
        success: false as const,
        state: {
          errors: z.flattenError(formResult.error).fieldErrors,
          message: "Error parsing featured recipe",
        },
      };
    }
    return { success: true as const, parsed: formResult.data };
  },

  async buildCreateData(parsed) {
    const date: number = parsed.date || Date.now();
    const slug = slugify(
      parsed.slug || createDefaultFeaturedRecipeSlug({ date }),
    );
    const data: FeaturedRecipe = {
      recipe: parsed.recipe,
      date,
      note: parsed.note,
    };
    return { slug, data };
  },

  async buildUpdateData(parsed, currentSlug, currentDate) {
    const slug = slugify(parsed.slug || currentSlug);
    const date = parsed.date || currentDate || Date.now();
    const data: FeaturedRecipe = {
      recipe: parsed.recipe,
      date,
      note: parsed.note,
    };
    return { slug, data };
  },

  buildCurrentIndexKey(currentDate, currentSlug) {
    return [currentDate, currentSlug];
  },
};

const featuredRecipeActions = createGenericActions(featuredRecipeEditorConfig);
export const createFeaturedRecipe = featuredRecipeActions.create;
export const updateFeaturedRecipe = featuredRecipeActions.update;
export const deleteFeaturedRecipe = featuredRecipeActions.delete;

export async function rebuildFeaturedRecipeIndex() {
  const contentDirectory = getContentDirectory();
  await rebuildIndex({
    config: featuredRecipeContentConfig,
    contentDirectory,
  });
  /*
   * A rebuild reprojects every page, so every cached page is potentially wrong
   * — and the pagination reads are cached entirely by tag, which `revalidatePath`
   * does not touch. Without this the operator presses "Rebuild" and the site
   * goes on serving pre-rebuild pages, which is the exact failure the button
   * exists to repair.
   */
  revalidateTag(featuredRecipePages.tags.all, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/featured-recipes");
}
