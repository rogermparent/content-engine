"use server";

import { getProjectUploadsDirectory } from "./filesystemDirectories";
import { createWriteStream } from "fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { ParsedProjectFormData } from "./parseFormData";
import { mkdirIfNeeded } from "../util/mkdirIfNeeded";
import { Project } from "./types";

export interface ProjectImageData {
  hasImage: boolean;
  imageName?: string | undefined;
  image?: File | undefined;
}

export async function getProjectFileInfo(
  projectFormData: ParsedProjectFormData,
  currentProjectData?: Project | undefined,
): Promise<ProjectImageData> {
  const { image, clearImage } = projectFormData;

  if (!image || image.size === 0) {
    if (clearImage) {
      return { hasImage: false };
    }
    return { hasImage: false, imageName: currentProjectData?.image };
  }

  return { hasImage: true, imageName: image.name, image };
}

export default async function writeProjectFiles(
  projectBaseDirectory: string,
  { hasImage, imageName, image }: ProjectImageData,
): Promise<void> {
  if (!hasImage) {
    return undefined;
  }

  await mkdirIfNeeded(getProjectUploadsDirectory(projectBaseDirectory));

  const imageWriteStream = createWriteStream(
    `${projectBaseDirectory}/uploads/${imageName}`,
  );
  const readStream = Readable.fromWeb(
    (image as File).stream() as ReadableStream,
  );
  await pipeline(readStream, imageWriteStream);
}
