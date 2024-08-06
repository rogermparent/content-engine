"use server";

import { getPageUploadsDirectory } from "./filesystemDirectories";
import { createWriteStream } from "fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { ParsedPageFormData } from "./parseFormData";
import { mkdirIfNeeded } from "../util/mkdirIfNeeded";
import { Page } from "./types";

export interface PageImageData {
  hasImage: boolean;
  imageName?: string | undefined;
  image?: File | undefined;
}

export async function getPageFileInfo(
  pageFormData: ParsedPageFormData,
  currentPageData?: Page | undefined,
): Promise<PageImageData> {
  const { image, clearImage } = pageFormData;

  if (!image || image.size === 0) {
    if (clearImage) {
      return { hasImage: false };
    }
    return { hasImage: false, imageName: currentPageData?.image };
  }

  return { hasImage: true, imageName: image.name, image };
}

export default async function writePageFiles(
  pageBaseDirectory: string,
  { hasImage, imageName, image }: PageImageData,
): Promise<void> {
  if (!hasImage) {
    return undefined;
  }

  await mkdirIfNeeded(getPageUploadsDirectory(pageBaseDirectory));

  const imageWriteStream = createWriteStream(
    `${pageBaseDirectory}/uploads/${imageName}`,
  );
  const readStream = Readable.fromWeb(
    (image as File).stream() as ReadableStream,
  );
  await pipeline(readStream, imageWriteStream);
}
