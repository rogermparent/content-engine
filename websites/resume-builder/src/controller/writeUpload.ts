"use server";

import { getResumeUploadPath } from "./filesystemDirectories";
import { createWriteStream } from "fs";
import { basename, parse } from "path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { ParsedResumeFormData } from "./parseFormData";
import { Resume } from "./types";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { ensureDir } from "fs-extra";

export interface ResumeImageData {
  imageName: string;
  image?: File | undefined;
  imageImportUrl?: string | undefined;
}

export async function getResumeFileInfo(
  resumeFormData: ParsedResumeFormData,
  currentResumeData?: Resume | undefined,
): Promise<ResumeImageData | undefined> {
  const { image, clearImage, imageImportUrl } = resumeFormData;

  if (image && image.size !== 0) {
    return { imageName: image.name, image };
  }
  if (clearImage) {
    return undefined;
  }
  if (imageImportUrl) {
    return {
      imageName: basename(imageImportUrl),
      imageImportUrl,
    };
  }
  if (currentResumeData?.image) {
    return { imageName: currentResumeData.image };
  }
}

export default async function writeResumeFiles(
  slug: string,
  { imageName, image, imageImportUrl }: ResumeImageData,
): Promise<void> {
  if (!image && !imageImportUrl) {
    return undefined;
  }

  const contentDirectory = getContentDirectory();
  const resultPath = getResumeUploadPath(contentDirectory, slug, imageName);

  const { dir } = parse(resultPath);
  await ensureDir(dir);
  const imageWriteStream = createWriteStream(resultPath);
  if (image) {
    const readStream = Readable.fromWeb(
      (image as File).stream() as ReadableStream,
    );
    await pipeline(readStream, imageWriteStream);
  } else if (imageImportUrl) {
    const importedImageData = await fetch(imageImportUrl);
    if (importedImageData.body) {
      await pipeline(
        Readable.fromWeb(importedImageData.body as ReadableStream),
        imageWriteStream,
      );
    }
  }
}
