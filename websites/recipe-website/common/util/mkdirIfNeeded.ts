import { mkdir } from "node:fs/promises";

export async function mkdirIfNeeded(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    if ((e as { code: string }).code !== "EEXIST") {
      throw e;
    }
  }
}
