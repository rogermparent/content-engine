import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Recipe } from "recipe-website-common/controller/types";
import { getRecipeDirectory } from "recipe-website-common/controller/filesystemDirectories";
import getRecipeDatabase from "recipe-website-common/controller/database";
import buildRecipeIndexValue from "recipe-website-common/controller/buildIndexValue";
import writeRecipeFiles, {
  RecipeFileData,
  getUploadInfo,
} from "../writeUpload";
import { outputJson } from "fs-extra";
import { join } from "path";
import updateContentFile from "content-engine/fs/updateContentFile";

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
}: {
  slug: string;
  data: Recipe;
  imageData?: RecipeFileData;
  videoData?: RecipeFileData;
  currentSlug?: string;
}) {
  if (currentSlug) {
    const currentRecipeDirectory = getRecipeDirectory(currentSlug);
    const finalRecipeDirectory = getRecipeDirectory(slug);

    await updateContentFile({
      baseDirectory: finalRecipeDirectory,
      currentBaseDirectory: currentRecipeDirectory,
      filename: "recipe.json",
      data,
    });
  } else {
    const baseDirectory = getRecipeDirectory(slug);
    await outputJson(join(baseDirectory, "recipe.json"), data);
  }

  if (imageData) {
    await writeRecipeFiles(slug, imageData);
  }

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
