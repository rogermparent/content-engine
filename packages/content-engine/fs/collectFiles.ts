import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function getDirContents(dir: string) {
  try {
    const dirContents = await readdir(dir, { withFileTypes: true });
    return dirContents;
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return undefined;
    }
    throw e;
  }
}

export async function collectFiles<T>(
  base: string,
  filename: string,
  getMassagedFile: (dir: string) => Promise<T>,
  dir: string = "",
  filePromises: Promise<T>[] = [],
) {
  const dirContents = await getDirContents(join(base, dir));
  if (dirContents) {
    for (const item of dirContents) {
      if (item.isDirectory()) {
        await collectFiles<T>(
          base,
          filename,
          getMassagedFile,
          join(dir, item.name),
          filePromises,
        );
      } else if (item.name === filename) {
        filePromises.push(getMassagedFile(dir));
      }
    }
  }
  return filePromises;
}
