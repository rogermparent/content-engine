"use server";

import { getRecipeUploadPath } from "./filesystemDirectories";
import { createWriteStream } from "fs";
import { basename, parse } from "path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { ParsedRecipeFormData } from "./parseFormData";
import { Recipe } from "./types";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { ensureDir } from "fs-extra";

export interface RecipeImageData {
  imageName: string;
  image?: File | undefined;
  imageImportUrl?: string | undefined;
}

export async function getRecipeFileInfo(
  recipeFormData: ParsedRecipeFormData,
  currentRecipeData?: Recipe | undefined,
): Promise<Partial<RecipeImageData>> {
  const { image, clearImage, imageImportUrl } = recipeFormData;

  if (!image || image.size === 0) {
    if (clearImage) {
      return {};
    }
    if (imageImportUrl) {
      return {
        imageName: basename(imageImportUrl),
        imageImportUrl,
      };
    }
    return { imageName: currentRecipeData?.image };
  }

  return { imageName: image.name, image };
}

export default async function writeRecipeFiles(
  slug: string,
  { imageName, image, imageImportUrl }: RecipeImageData,
): Promise<void> {
  if (!image && !imageImportUrl) {
    return undefined;
  }

  const contentDirectory = getContentDirectory();
  const resultPath = getRecipeUploadPath(contentDirectory, slug, imageName);

  const { dir } = parse(resultPath);
  await ensureDir(dir);
  const imageWriteStream = createWriteStream(resultPath);
  if (image) {
    const readStream = Readable.fromWeb(
      (image as File).stream() as ReadableStream<any>,
    );
    await pipeline(readStream, imageWriteStream);
  } else if (imageImportUrl) {
    const importedImageData = await fetch(imageImportUrl);
    if (importedImageData.body) {
      await pipeline(
        Readable.fromWeb(importedImageData.body as ReadableStream<any>),
        imageWriteStream,
      );
    }
  }
}
