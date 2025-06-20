import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Recipe } from "recipe-website-common/controller/types";
import {
  getRecipeDirectory,
  getRecipeUploadsPath,
} from "recipe-website-common/controller/filesystemDirectories";
import getRecipeDatabase from "recipe-website-common/controller/database";
import buildRecipeIndexValue from "recipe-website-common/controller/buildIndexValue";
import writeRecipeFiles, {
  RecipeFileData,
  getUploadInfo,
  removeOldRecipeUploads,
} from "../writeUpload";
import { ensureDir, exists, outputJson, rename } from "fs-extra";
import path, { join } from "path";
import updateContentFile from "content-engine/fs/updateContentFile";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";

// Function to process image and video uploads
export async function processUploads({
  video,
  clearVideo,
  existingVideo,
  image,
  clearImage,
  existingImage,
  imageImportUrl,
}: {
  video?: File;
  clearVideo?: boolean;
  existingVideo?: string;
  image?: File;
  clearImage?: boolean;
  existingImage?: string;
  imageImportUrl?: string;
}): Promise<{ imageData?: RecipeFileData; videoData?: RecipeFileData }> {
  const imageData = await getUploadInfo({
    file: image,
    clearFile: clearImage,
    fileImportUrl: imageImportUrl,
    existingFile: existingImage,
  });
  const videoData = await getUploadInfo({
    file: video,
    clearFile: clearVideo,
    existingFile: existingVideo,
  });
  return { imageData, videoData };
}

// Function to write recipe data to filesystem
export async function writeRecipeToFilesystem({
  slug,
  data,
  imageData,
  videoData,
  currentSlug,
  existingImage,
  existingVideo,
}: {
  slug: string;
  data: Recipe;
  imageData?: RecipeFileData;
  videoData?: RecipeFileData;
  currentSlug?: string;
  existingImage?: string;
  existingVideo?: string;
}) {
  // Rename directories if slug has changed
  const contentDirectory = getContentDirectory();
  const finalRecipeDirectory = getRecipeDirectory(slug);
  if (currentSlug !== undefined && slug !== currentSlug) {
    const currentRecipeDirectory = getRecipeDirectory(currentSlug);
    await rename(currentRecipeDirectory, finalRecipeDirectory);
    const existingUploadsPath = getRecipeUploadsPath(
      contentDirectory,
      currentSlug,
    );
    if (await exists(existingUploadsPath)) {
      const finalUploadsPath = getRecipeUploadsPath(contentDirectory, slug);
      await ensureDir(path.resolve(finalUploadsPath, ".."));
      await rename(existingUploadsPath, finalUploadsPath);
    }
  }

  await updateContentFile({
    baseDirectory: finalRecipeDirectory,
    filename: "recipe.json",
    data,
  });

  await removeOldRecipeUploads(slug, imageData, existingImage);
  if (imageData) {
    await writeRecipeFiles(slug, imageData);
  }

  await removeOldRecipeUploads(slug, videoData, existingVideo);
  if (videoData) {
    await writeRecipeFiles(slug, videoData);
  }
}

// Function to write recipe to LMDB index
export async function writeRecipeToIndex(
  data: Recipe,
  date: number,
  slug: string,
  currentDate?: number,
  currentSlug?: string,
) {
  const db = getRecipeDatabase();
  try {
    if (currentDate && currentSlug) {
      const willRename = currentSlug !== slug;
      const willChangeDate = currentDate !== date;

      if (willRename || willChangeDate) {
        db.remove([currentDate, currentSlug]);
      }
    }
    await db.put([date, slug], buildRecipeIndexValue(data));
  } catch {
    throw new Error("Failed to write recipe to index");
  } finally {
    db.close();
  }
}

// Function to handle success actions like revalidating and redirecting
export function handleSuccess(slug: string, currentSlug?: string) {
  if (currentSlug && currentSlug !== slug) {
    revalidatePath("/recipe/" + currentSlug);
  }
  revalidatePath("/recipe/" + slug);
  revalidatePath("/recipes");
  revalidatePath("/recipes/[page]", "page");
  revalidatePath("/");
  redirect("/recipe/" + slug);
}
