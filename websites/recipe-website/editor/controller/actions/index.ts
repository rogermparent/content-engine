"use server";

import { auth } from "@/auth";
import slugify from "@sindresorhus/slugify";
import { createContent } from "content-engine/content/createContent";
import { deleteContent } from "content-engine/content/deleteContent";
import { rebuildIndex } from "content-engine/content/rebuildIndex";
import { updateContent } from "content-engine/content/updateContent";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { writeFile } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { join } from "node:path";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";
import { Recipe, RecipeEntryKey } from "recipe-website-common/controller/types";
import simpleGit, { SimpleGit } from "simple-git";
import { z } from "zod";
import parseRecipeFormData from "../parseFormData";

const INITIAL_COMMIT_MESSAGE = "Initial commit";

const remoteSchema = z.object({
  remoteName: z.string().min(1, "Remote Name is required"),
  remoteUrl: z.string().min(1, "Remote URL is required"),
});

// Function to handle success actions like revalidating and redirecting
function handleSuccess(slug: string, currentSlug?: string) {
  if (currentSlug && currentSlug !== slug) {
    revalidatePath("/recipe/" + currentSlug);
  }
  revalidatePath("/recipe/" + slug);
  revalidatePath("/recipes");
  revalidatePath("/recipes/[page]", "page");
  revalidatePath("/");
  redirect("/recipe/" + slug);
}

export async function rebuildRecipeIndex() {
  const contentDirectory = getContentDirectory();
  await rebuildIndex({
    config: recipeContentConfig,
    contentDirectory,
  });
  revalidatePath("/");
}

export async function updateRecipe(
  currentDate: number,
  currentSlug: string,
  _prevState: RecipeFormState | null,
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

  const contentDirectory = getContentDirectory();

  const formResult = parseRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: z.flattenError(formResult.error).fieldErrors,
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
    recipeYield,
    timelines,
  } = formResult.data;

  const currentRecipeData = await getRecipeBySlug({
    slug: currentSlug,
    contentDirectory,
  });

  const finalSlug = slugify(slug || createDefaultSlug(formResult.data));
  const finalDate = date || currentDate || Date.now();

  // Build uploads spec - content-engine will resolve these to FileUploadData
  const uploads = {
    image: {
      file: image,
      clearFile: clearImage,
      existingFile: currentRecipeData?.image,
    },
    video: {
      file: video,
      clearFile: clearVideo,
      existingFile: currentRecipeData?.video,
    },
  };

  // Determine final filenames based on upload specs
  const imageFileName =
    image && image.size > 0
      ? image.name
      : clearImage
        ? undefined
        : currentRecipeData?.image;
  const videoFileName =
    video && video.size > 0
      ? video.name
      : clearVideo
        ? undefined
        : currentRecipeData?.video;

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageFileName,
    video: videoFileName,
    date: finalDate,
    prepTime,
    cookTime,
    totalTime,
    recipeYield,
    timelines,
  };

  const currentIndexKey: RecipeEntryKey = [currentDate, currentSlug];

  try {
    // Update content (processes uploads, renames directories if needed, writes data file, updates index, commits)
    await updateContent({
      config: recipeContentConfig,
      slug: finalSlug,
      currentSlug,
      currentIndexKey,
      data,
      contentDirectory,
      author: { name: email, email },
      commitMessage: `Update recipe: ${finalSlug}`,
      uploads,
    });
  } catch {
    return { message: "Failed to update recipe" };
  }

  handleSuccess(finalSlug, currentSlug);

  return { message: "Recipe update successful!" };
}

// Main createRecipe function to orchestrate the process
export async function createRecipe(
  _prevState: RecipeFormState | null,
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

  const contentDirectory = getContentDirectory();

  const formResult = parseRecipeFormData(formData);

  if (!formResult.success) {
    return {
      errors: z.flattenError(formResult.error).fieldErrors,
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
    recipeYield,
    timelines,
  } = formResult.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultSlug(formResult.data));

  // Build uploads spec - content-engine will resolve these to FileUploadData
  const uploads = {
    image: {
      file: image,
      clearFile: clearImage,
      fileImportUrl: imageImportUrl,
    },
    video: {
      file: video,
      clearFile: clearVideo,
    },
  };

  // Determine final filenames based on upload specs
  const imageFileName =
    image && image.size > 0
      ? image.name
      : imageImportUrl
        ? new URL(imageImportUrl).pathname.split("/").pop()
        : undefined;
  const videoFileName = video && video.size > 0 ? video.name : undefined;

  const data: Recipe = {
    name,
    description,
    ingredients,
    instructions,
    image: imageFileName,
    video: videoFileName,
    date,
    prepTime,
    cookTime,
    totalTime,
    recipeYield,
    timelines,
  };

  try {
    // Create content (processes uploads, writes data file, updates index, commits)
    await createContent({
      config: recipeContentConfig,
      slug,
      data,
      contentDirectory,
      author: { name: email, email },
      commitMessage: `Add new recipe: ${slug}`,
      uploads,
    });
  } catch {
    return { message: "Failed to create recipe" };
  }

  handleSuccess(slug);

  return { message: "Recipe creation successful!" };
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

  const contentDirectory = getContentDirectory();
  const indexKey: RecipeEntryKey = [date, slug];

  await deleteContent({
    config: recipeContentConfig,
    slug,
    indexKey,
    contentDirectory,
    author: { name: email, email },
    commitMessage: `Delete recipe: ${slug}`,
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
    const flattenedErrors = z.flattenError(result.error);

    return (
      flattenedErrors.fieldErrors.remoteName?.[0] ??
      flattenedErrors.fieldErrors.remoteUrl?.[0]
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

  const contentDirectory = getContentDirectory();
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
