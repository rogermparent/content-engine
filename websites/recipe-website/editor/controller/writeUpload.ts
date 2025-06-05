"use server";

import { getRecipeUploadPath } from "recipe-website-common/controller/filesystemDirectories";
import { createWriteStream } from "fs";
import { basename, parse } from "path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { ensureDir } from "fs-extra";

export interface RecipeFileData {
  fileName: string;
  file?: File | undefined;
  fileImportUrl?: string | undefined;
}

export async function getUploadInfo({
  file,
  clearFile,
  fileImportUrl,
  existingFile,
}: {
  file?: File;
  clearFile?: boolean;
  fileImportUrl?: string;
  existingFile?: string;
}): Promise<RecipeFileData | undefined> {
  if (file && file.size !== 0) {
    return { fileName: file.name, file };
  }
  if (clearFile) {
    return undefined;
  }
  if (fileImportUrl) {
    const url = new URL(fileImportUrl);
    const basenameWithoutParams = basename(url.pathname);
    return {
      fileName: basenameWithoutParams,
      fileImportUrl,
    };
  }
  if (existingFile) {
    return { fileName: existingFile };
  }
}

export default async function writeRecipeFiles(
  slug: string,
  { fileName, file, fileImportUrl }: RecipeFileData,
): Promise<void> {
  if (!file && !fileImportUrl) {
    return undefined;
  }

  const contentDirectory = getContentDirectory();
  const resultPath = getRecipeUploadPath(contentDirectory, slug, fileName);

  const { dir } = parse(resultPath);
  await ensureDir(dir);
  const fileWriteStream = createWriteStream(resultPath);
  if (file) {
    const readStream = Readable.fromWeb(
      (file as File).stream() as ReadableStream,
    );
    await pipeline(readStream, fileWriteStream);
  } else if (fileImportUrl) {
    const importedFileData = await fetch(fileImportUrl);
    if (importedFileData.body) {
      await pipeline(
        Readable.fromWeb(importedFileData.body as ReadableStream),
        fileWriteStream,
      );
    }
  }
}
