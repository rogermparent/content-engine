"use server";

import slugify from "@sindresorhus/slugify";
import { commitContentChanges } from "content-engine/git/commit";
import { exists, readFile, readdir } from "fs-extra";
import { rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import buildRecipeIndexValue from "recipe-website-common/controller/buildIndexValue";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import getRecipeBySlug from "recipe-website-common/controller/data/read";
import getRecipeDatabase from "recipe-website-common/controller/database";
import {
  getRecipeDirectory,
  getRecipeFilePath,
  recipeDataDirectory,
} from "recipe-website-common/controller/filesystemDirectories";
import { Recipe } from "recipe-website-common/controller/types";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import parseRecipeFormData from "../parseFormData";
import {
  handleSuccess,
  processUploads,
  writeRecipeToFilesystem,
  writeRecipeToIndex,
} from "./common";

import simpleGit, { SimpleGit } from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";

import { z } from "zod";

import { writeFile } from "fs-extra";
import { join } from "node:path";

import { auth } from "@/auth";

const INITIAL_COMMIT_MESSAGE = "Initial commit";

const remoteSchema = z.object({
  remoteName: z.string().min(1, "Remote Name is required"),
  remoteUrl: z.string().min(1, "Remote URL is required"),
});

export async function rebuildRecipeIndex() {
  const db = getRecipeDatabase();
  await db.drop();
  if (await exists(recipeDataDirectory)) {
    const recipeDirectories = await readdir(recipeDataDirectory);
    for (const slug of recipeDirectories) {
      const recipeFilePath = getRecipeFilePath(getRecipeDirectory(slug));
      const recipeFileContents = JSON.parse(
        String(await readFile(recipeFilePath)),
      );
      const { date } = recipeFileContents as Recipe;
      await db.put([date, slug], buildRecipeIndexValue(recipeFileContents));
    }
  }
  db.close();
  revalidatePath("/");
}

export async function updateRecipe(
  currentDate: number,
  currentSlug: string,
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return { message: "Authentication required" };
  }
  const {
    user: { email },
  } = session;

  const formResult = parseRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: formResult.error.flatten().fieldErrors,
      message: "Failed to update Recipe.",
    };
  }

  const {
    date,
    slug,
    name,
    description,
    ingredients,
    instructions,
    clearImage,
    image,
    video,
    clearVideo,
    prepTime,
    cookTime,
    totalTime,
  } = formResult.data;

  const currentRecipeData = await getRecipeBySlug(currentSlug);

  const finalSlug = slugify(slug || createDefaultSlug(formResult.data));
  const finalDate = date || currentDate || Date.now();

  const { imageData, videoData } = await processUploads({
    video,
    clearVideo,
    existingVideo: currentRecipeData?.video,
    image,
    clearImage,
    existingImage: currentRecipeData?.image,
  });

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageData?.fileName,
    video: videoData?.fileName,
    date: finalDate,
    prepTime,
    cookTime,
    totalTime,
  };

  try {
    await writeRecipeToFilesystem({
      slug: finalSlug,
      data,
      imageData,
      videoData,
      currentSlug,
    });
  } catch {
    return { message: "Failed to write recipe files" };
  }

  try {
    await writeRecipeToIndex(
      data,
      finalDate,
      finalSlug,
      currentDate,
      currentSlug,
    );
  } catch {
    return { message: "Failed to write recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Update recipe: ${finalSlug}`, {
      name: email,
      email,
    });
  } catch {
    return { message: "Failed to commit content changes to Git" };
  }

  handleSuccess(finalSlug, currentSlug);

  return { message: "Recipe update successful!" };
}

// Main createRecipe function to orchestrate the process
export async function createRecipe(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return { message: "Authentication required" };
  }
  const {
    user: { email },
  } = session;

  const formResult = parseRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: formResult.error.flatten().fieldErrors,
      message: "Error parsing recipe",
    };
  }

  const {
    date: givenDate,
    slug: givenSlug,
    name,
    description,
    ingredients,
    instructions,
    image,
    clearImage,
    video,
    clearVideo,
    imageImportUrl,
    prepTime,
    cookTime,
    totalTime,
  } = formResult.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultSlug(formResult.data));

  const { imageData, videoData } = await processUploads({
    image,
    clearImage,
    video,
    clearVideo,
    imageImportUrl,
  });

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageData?.fileName,
    video: videoData?.fileName,
    date,
    prepTime,
    cookTime,
    totalTime,
  };

  try {
    await writeRecipeToFilesystem({ slug, data, imageData, videoData });
  } catch {
    return { message: "Failed to write recipe files" };
  }

  try {
    await writeRecipeToIndex(data, date, slug);
  } catch {
    return { message: "Failed to write recipe to LMDB index" };
  }

  try {
    await commitContentChanges(`Add new recipe: ${slug}`, {
      name: email,
      email,
    });
  } catch {
    return { message: "Failed to commit content changes to Git" };
  }

  handleSuccess(slug);

  return { message: "Recipe creation successful!" };
}

async function removeFromDatabase(date: number, slug: string) {
  const db = getRecipeDatabase();
  try {
    await db.remove([date, slug]);
  } catch {
    throw new Error("Failed to remove recipe from index");
  } finally {
    db.close();
  }
}

export async function deleteRecipe(date: number, slug: string) {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }
  const {
    user: { email },
  } = session;

  const recipeDirectory = getRecipeDirectory(slug);
  await rm(recipeDirectory, { recursive: true });

  await removeFromDatabase(date, slug);
  await commitContentChanges(`Delete recipe: ${slug}`, {
    name: email,
    email,
  });

  revalidatePath("/recipe/" + slug);
  revalidatePath("/");
  redirect("/");
}

export async function createRemote(
  _state: string | undefined,
  formData: FormData,
) {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return "Authentication required";
  }

  const contentDirectory = getContentDirectory();
  const result = remoteSchema.safeParse({
    remoteName: formData.get("remoteName"),
    remoteUrl: formData.get("remoteUrl"),
  });

  if (!result.success) {
    return (
      result.error.flatten().fieldErrors.remoteName?.[0] ??
      result.error.flatten().fieldErrors.remoteUrl?.[0]
    );
  }

  if (await directoryIsGitRepo(contentDirectory)) {
    try {
      const git = simpleGit({
        baseDir: contentDirectory,
      });
      await git.addRemote(result.data.remoteName, result.data.remoteUrl);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof e.message === "string"
      ) {
        return e.message;
      } else {
        throw e;
      }
    }
  }
  revalidatePath("/git");
}

export async function createBranch(
  _state: string | undefined,
  formData: FormData,
) {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return "Authentication required";
  }

  const contentDirectory = getContentDirectory();
  const branchName = formData.get("branchName") as string;
  if (!branchName) {
    return "Branch Name is required";
  }
  if (await directoryIsGitRepo(contentDirectory)) {
    try {
      await simpleGit(contentDirectory).checkout(["-b", branchName]);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof e.message === "string"
      ) {
        return e.message;
      } else {
        throw e;
      }
    }
  }
  revalidatePath("/git");
}

const commandHandlers: Record<
  string,
  (args: { git: SimpleGit; branch: string }) => Promise<void>
> = {
  async checkout({ git, branch }) {
    if (!branch) {
      throw new Error("Invalid branch");
    }
    await git.checkout(branch);
    await rebuildRecipeIndex();
  },
  async delete({ git, branch }) {
    if (!branch) {
      throw new Error("Invalid branch");
    }
    await git.deleteLocalBranch(branch);
  },
  async forceDelete({ git, branch }) {
    if (!branch) {
      throw new Error("Invalid branch");
    }
    await git.deleteLocalBranch(branch, true);
  },
};

export async function branchCommandAction(
  _previousState: string | null,
  formData: FormData,
): Promise<string | null> {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return "Authentication required";
  }

  const command = formData.get("command");
  if (typeof command !== "string") {
    return "No command provided!";
  }
  const commandHandler = commandHandlers[command];
  if (!commandHandler) {
    return `Invalid command: ${command}`;
  }
  const branch = formData.get("branch");
  if (typeof branch !== "string") {
    return `Invalid branch`;
  }
  const contentDirectory = getContentDirectory();
  if (!(await directoryIsGitRepo(contentDirectory))) {
    return "Content directory is not a Git repository.";
  }
  try {
    const git = simpleGit({
      baseDir: contentDirectory,
    });
    await commandHandler({ git, branch });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "message" in e &&
      typeof e.message === "string"
    ) {
      return e.message;
    } else {
      throw e;
    }
  }
  await rebuildRecipeIndex();
  revalidatePath("/git");
  return null;
}

export async function remoteCommandAction(
  _previousState: string | null,
  _formData: FormData,
): Promise<string | null> {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return "Authentication required";
  }

  return null;
}

export async function initializeContentGit() {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }
  const {
    user: { email },
  } = session;

  const contentDirectory = getContentDirectory();
  if (!(await directoryIsGitRepo(contentDirectory))) {
    const git = simpleGit({
      baseDir: contentDirectory,
    });
    await git.init();
    await writeFile(
      join(contentDirectory, ".gitignore"),
      `/transformed-images
/recipes/index`,
    );
    await git.add(".");
    await git.commit(INITIAL_COMMIT_MESSAGE, {
      "--author": `${email} <${email}>`,
    });
  }
  revalidatePath("/git");
}
