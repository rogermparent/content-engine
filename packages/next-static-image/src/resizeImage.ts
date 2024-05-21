import { parse } from "path";
import type { Sharp } from "sharp";
import { mkdir, stat } from "fs/promises";
import { oraPromise } from "ora";

// Simple method of avoiding running two of the same resize operation at once.
const runningResizes = new Map();

interface ImageResizeProps {
  sharp: Sharp;
  width: number;
  quality: number;
  resultPath: string;
  resultFilename: string;
  srcMtime: Date;
}

async function resizeImage({
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
  } catch (e) {}

  // Attempt to create directory for result, keep going if it already exists
  const { dir } = parse(resultPath);
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {}

  await oraPromise(
    sharp.resize({ width }).webp({ quality }).toFile(resultPath),
    `Resizing ${resultFilename}`,
  );

  // Release our spot in cache for currently running transforms.
  runningResizes.delete(resultPath);
}

export async function queuePossibleImageResize(props: ImageResizeProps) {
  const { resultPath } = props;
  // If this same transform is currently running, await it and return.
  const currentlyRunningTransform = runningResizes.get(resultPath);
  if (currentlyRunningTransform) {
    await currentlyRunningTransform;
    return;
  }

  // Otherwise, claim our spot in cache and start the transform.
  const resizePromise = resizeImage(props);
  runningResizes.set(resultPath, resizePromise);
  await resizePromise;
}
