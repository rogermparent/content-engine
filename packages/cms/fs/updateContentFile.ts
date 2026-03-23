import { ensureDir, outputJSON } from "fs-extra";
import { join } from "path";

export default async function updateContentFile<T = Record<string, unknown>>({
  baseDirectory,
  filename,
  data,
}: {
  baseDirectory: string;
  filename: string;
  data: T;
}) {
  await ensureDir(baseDirectory);
  await outputJSON(join(baseDirectory, filename), data);
}
