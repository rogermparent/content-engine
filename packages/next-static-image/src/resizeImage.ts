import { parse } from "path";
import type { Sharp } from "sharp";
import { ensureDir, stat } from "fs-extra";

interface ImageResizeProps {
  sharp: Sharp;
  width: number;
  quality: number;
  resultPath: string;
  resultFilename: string;
  srcMtime: Date;
}

export async function queuePossibleImageResize({
  resultPath,
  srcMtime,
  sharp,
  width,
  quality,
  resultFilename,
}: ImageResizeProps) {
  // Return early if the exact image we're creating exists on the filesystem and is newer than the source image
  try {
    const { mtime: outputMtime } = await stat(resultPath);
    if (srcMtime < outputMtime) {
      return;
    }
  } catch (e) {
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) {
      throw e;
    }
  }

  // Attempt to create directory for result, keep going if it already exists
  const { dir } = parse(resultPath);
  await ensureDir(dir);

  // Get the original image metadata
  const metadata = await sharp.metadata();
  const originalWidth = metadata.width;

  // Check if the target width is larger than the original width
  if (originalWidth === undefined || width <= originalWidth) {
    await sharp.resize({ width }).webp({ quality }).toFile(resultPath);
  } else {
    // If the target width is larger than the original width, skip resizing
    await sharp.webp({ quality }).toFile(resultPath);
  }
}
