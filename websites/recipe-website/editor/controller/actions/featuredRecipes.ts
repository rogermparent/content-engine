"use server";

import { auth } from "@/auth";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import updateContentFile from "content-engine/fs/updateContentFile";
import { commitContentChanges } from "content-engine/git/commit";
import { ensureDir, exists, readdir, readFile, rm } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolve } from "node:path";
import slugify from "@sindresorhus/slugify";
import buildFeaturedRecipeIndexValue from "recipe-website-common/controller/buildFeaturedRecipeIndexValue";
import createDefaultFeaturedRecipeSlug from "recipe-website-common/controller/createFeaturedRecipeSlug";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import getFeaturedRecipeDatabase from "recipe-website-common/controller/featuredRecipeDatabase";
import {
  getFeaturedRecipeDirectory,
  getFeaturedRecipeFilePath,
  getFeaturedRecipeDataDirectory,
} from "recipe-website-common/controller/filesystemDirectories";
import { FeaturedRecipeFormState } from "recipe-website-common/controller/featuredRecipeFormState";
import { FeaturedRecipe } from "recipe-website-common/controller/types";
import { z } from "zod";
import parseFeaturedRecipeFormData from "../parseFeaturedRecipeFormData";
import { rename } from "fs-extra";

// Function to write featured recipe data to filesystem
async function writeFeaturedRecipeToFilesystem({
  contentDirectory,
  slug,
  data,
  currentSlug,
}: {
  contentDirectory: string;
  slug: string;
  data: FeaturedRecipe;
  currentSlug?: string;
}) {
  // Rename directories if slug has changed
  const finalFeaturedRecipeDirectory = getFeaturedRecipeDirectory(
    slug,
    contentDirectory,
  );
  if (currentSlug !== undefined && slug !== currentSlug) {
    const currentFeaturedRecipeDirectory = getFeaturedRecipeDirectory(
      currentSlug,
      contentDirectory,
    );
    if (await exists(currentFeaturedRecipeDirectory)) {
      await rename(
        currentFeaturedRecipeDirectory,
        finalFeaturedRecipeDirectory,
      );
    }
  }

  await ensureDir(finalFeaturedRecipeDirectory);
  await updateContentFile({
    baseDirectory: finalFeaturedRecipeDirectory,
    filename: "featured-recipe.json",
    data,
  });
}

// Function to write featured recipe to LMDB index
async function writeFeaturedRecipeToIndex(
  contentDirectory: string,
  data: FeaturedRecipe,
  date: number,
  slug: string,
  currentDate?: number,
  currentSlug?: string,
) {
  const db = getFeaturedRecipeDatabase(contentDirectory);
  try {
    if (currentDate && currentSlug) {
      const willRename = currentSlug !== slug;
      const willChangeDate = currentDate !== date;

      if (willRename || willChangeDate) {
        db.remove([currentDate, currentSlug]);
      }
    }
    await db.put([date, slug], buildFeaturedRecipeIndexValue(data));
  } catch {
    throw new Error("Failed to write featured recipe to index");
  } finally {
    db.close();
  }
}

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
    await writeFeaturedRecipeToFilesystem({
      contentDirectory,
      slug,
      data,
    });
  } catch (e) {
    return { message: "Failed to write featured recipe files" };
  }

  try {
    await writeFeaturedRecipeToIndex(contentDirectory, data, date, slug);
  } catch (e) {
    return { message: "Failed to write featured recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Add new featured recipe: ${slug}`, {
      name: email,
      email,
    });
  } catch (e) {
    return { message: "Failed to commit content changes to Git" };
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

  const currentFeaturedRecipeData = await getFeaturedRecipeBySlug({
    slug: currentSlug,
    contentDirectory,
  });

  const finalSlug = slugify(givenSlug || currentSlug);
  const finalDate = date || currentDate || Date.now();

  const data: FeaturedRecipe = {
    recipe,
    date: finalDate,
    note,
  };

  try {
    await writeFeaturedRecipeToFilesystem({
      contentDirectory,
      slug: finalSlug,
      data,
      currentSlug,
    });
  } catch {
    return { message: "Failed to write featured recipe files" };
  }

  try {
    await writeFeaturedRecipeToIndex(
      contentDirectory,
      data,
      finalDate,
      finalSlug,
      currentDate,
      currentSlug,
    );
  } catch (e) {
    return { message: "Failed to write featured recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Update featured recipe: ${finalSlug}`, {
      name: email,
      email,
    });
  } catch (e) {
    return { message: "Failed to commit content changes to Git" };
  }

  handleFeaturedRecipeSuccess(finalSlug, currentSlug);

  return { message: "Featured recipe update successful!" };
}

// Note: handleFeaturedRecipeSuccess always redirects to homepage, so this return is never reached

async function removeFromDatabase(
  contentDirectory: string,
  date: number,
  slug: string,
) {
  const db = getFeaturedRecipeDatabase(contentDirectory);
  try {
    await db.remove([date, slug]);
  } catch {
    throw new Error("Failed to remove featured recipe from index");
  } finally {
    db.close();
  }
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
  const featuredRecipeDirectory = getFeaturedRecipeDirectory(
    slug,
    contentDirectory,
  );
  if (await exists(featuredRecipeDirectory)) {
    await rm(featuredRecipeDirectory, { recursive: true });
  }

  await removeFromDatabase(contentDirectory, date, slug);
  await commitContentChanges(`Delete featured recipe: ${slug}`, {
    name: email,
    email,
  });

  revalidatePath("/featured-recipes/" + slug);
  revalidatePath("/featured-recipes");
  revalidatePath("/");
  redirect("/featured-recipes");
}

export async function rebuildFeaturedRecipeIndex() {
  const contentDirectory = getContentDirectory();
  const db = getFeaturedRecipeDatabase(contentDirectory);
  await db.drop();
  const featuredRecipeDataDirectory =
    getFeaturedRecipeDataDirectory(contentDirectory);
  if (await exists(featuredRecipeDataDirectory)) {
    const featuredRecipeDirectories = await readdir(
      featuredRecipeDataDirectory,
    );
    for (const slug of featuredRecipeDirectories) {
      const featuredRecipeFilePath = getFeaturedRecipeFilePath(
        getFeaturedRecipeDirectory(slug, contentDirectory),
      );
      const featuredRecipeFileContents = JSON.parse(
        String(await readFile(featuredRecipeFilePath)),
      );
      const { date } = featuredRecipeFileContents as FeaturedRecipe;
      await db.put(
        [date, slug],
        buildFeaturedRecipeIndexValue(featuredRecipeFileContents),
      );
    }
  }
  db.close();
  revalidatePath("/");
  revalidatePath("/featured-recipes");
}
