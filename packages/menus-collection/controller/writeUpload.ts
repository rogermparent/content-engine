"use server";

import { getMenuUploadsDirectory } from "./filesystemDirectories";
import { createWriteStream } from "fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { ParsedMenuFormData } from "./parseFormData";
import { mkdirIfNeeded } from "../util/mkdirIfNeeded";
import { Menu } from "./types";

export interface MenuImageData {
  hasImage: boolean;
  imageName?: string | undefined;
  image?: File | undefined;
}

export async function getMenuFileInfo(
  menuFormData: ParsedMenuFormData,
  currentMenuData?: Menu | undefined,
): Promise<MenuImageData> {
  const { image, clearImage } = menuFormData;

  if (!image || image.size === 0) {
    if (clearImage) {
      return { hasImage: false };
    }
    return { hasImage: false, imageName: currentMenuData?.image };
  }

  return { hasImage: true, imageName: image.name, image };
}

export default async function writeMenuFiles(
  menuBaseDirectory: string,
  { hasImage, imageName, image }: MenuImageData,
): Promise<void> {
  if (!hasImage) {
    return undefined;
  }

  await mkdirIfNeeded(getMenuUploadsDirectory(menuBaseDirectory));

  const imageWriteStream = createWriteStream(
    `${menuBaseDirectory}/uploads/${imageName}`,
  );
  const readStream = Readable.fromWeb(
    (image as File).stream() as ReadableStream,
  );
  await pipeline(readStream, imageWriteStream);
}
