"use server";

import { auth } from "@/auth";
import { createContent } from "content-engine/content/createContent";
import { deleteContent } from "content-engine/content/deleteContent";
import { rebuildIndex } from "content-engine/content/rebuildIndex";
import { updateContent } from "content-engine/content/updateContent";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import createDefaultFeaturedRecipeSlug from "recipe-website-common/controller/createFeaturedRecipeSlug";
import { featuredRecipeContentConfig } from "recipe-website-common/controller/featuredRecipeContentConfig";
import { FeaturedRecipeFormState } from "recipe-website-common/controller/featuredRecipeFormState";
import {
  FeaturedRecipe,
  FeaturedRecipeEntryKey,
} from "recipe-website-common/controller/types";
import { z } from "zod";
import parseFeaturedRecipeFormData from "../parseFeaturedRecipeFormData";

// Function to handle success actions like revalidating and redirecting
function handleFeaturedRecipeSuccess(slug: string, currentSlug?: string) {
  if (currentSlug && currentSlug !== slug) {
    revalidatePath("/featured-recipes/" + currentSlug);
  }
  revalidatePath("/featured-recipes/" + slug);
  revalidatePath("/featured-recipes");
  revalidatePath("/");
  redirect("/");
}

export async function createFeaturedRecipe(
  _prevState: FeaturedRecipeFormState | null,
  formData: FormData,
): Promise<FeaturedRecipeFormState> {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return { message: "Authentication required" };
  }
  const {
    user: { email },
  } = session;

  const contentDirectory = getContentDirectory();

  const formResult = parseFeaturedRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: z.flattenError(formResult.error).fieldErrors,
      message: "Error parsing featured recipe",
    };
  }

  const { date: givenDate, slug: givenSlug, recipe, note } = formResult.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultFeaturedRecipeSlug({ date }));

  const data: FeaturedRecipe = {
    recipe,
    date,
    note,
  };

  try {
    await createContent({
      config: featuredRecipeContentConfig,
      slug,
      data,
      contentDirectory,
      author: { name: email, email },
      commitMessage: `Add new featured recipe: ${slug}`,
    });
  } catch {
    return { message: "Failed to create featured recipe" };
  }

  handleFeaturedRecipeSuccess(slug);

  return { message: "Featured recipe creation successful!" };
}

export async function updateFeaturedRecipe(
  currentDate: number,
  currentSlug: string,
  _prevState: FeaturedRecipeFormState | null,
  formData: FormData,
): Promise<FeaturedRecipeFormState> {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return { message: "Authentication required" };
  }
  const {
    user: { email },
  } = session;

  const contentDirectory = getContentDirectory();

  const formResult = parseFeaturedRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: z.flattenError(formResult.error).fieldErrors,
      message: "Failed to update Featured Recipe.",
    };
  }

  const { date, slug: givenSlug, recipe, note } = formResult.data;

  const finalSlug = slugify(givenSlug || currentSlug);
  const finalDate = date || currentDate || Date.now();

  const data: FeaturedRecipe = {
    recipe,
    date: finalDate,
    note,
  };

  const currentIndexKey: FeaturedRecipeEntryKey = [currentDate, currentSlug];

  try {
    // updateContent handles directory rename if slug changed
    await updateContent({
      config: featuredRecipeContentConfig,
      slug: finalSlug,
      currentSlug,
      currentIndexKey,
      data,
      contentDirectory,
      author: { name: email, email },
      commitMessage: `Update featured recipe: ${finalSlug}`,
    });
  } catch {
    return { message: "Failed to update featured recipe" };
  }

  handleFeaturedRecipeSuccess(finalSlug, currentSlug);

  return { message: "Featured recipe update successful!" };
}

export async function deleteFeaturedRecipe(date: number, slug: string) {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }
  const {
    user: { email },
  } = session;

  const contentDirectory = getContentDirectory();
  const indexKey: FeaturedRecipeEntryKey = [date, slug];

  await deleteContent({
    config: featuredRecipeContentConfig,
    slug,
    indexKey,
    contentDirectory,
    author: { name: email, email },
    commitMessage: `Delete featured recipe: ${slug}`,
  });

  revalidatePath("/featured-recipes/" + slug);
  revalidatePath("/featured-recipes");
  revalidatePath("/");
  redirect("/featured-recipes");
}

export async function rebuildFeaturedRecipeIndex() {
  const contentDirectory = getContentDirectory();
  await rebuildIndex({
    config: featuredRecipeContentConfig,
    contentDirectory,
  });
  revalidatePath("/");
  revalidatePath("/featured-recipes");
}
