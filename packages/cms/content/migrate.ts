import { exists, readdir } from "fs-extra";
import { getContentDirectory } from "../fs/getContentDirectory";
import {
  getDataDirectory,
  readContentFromFilesystem,
  writeContentToFilesystem,
} from "./filesystem";
import type { ContentTypeConfig } from "./types";

/**
 * Migrate data files
 *
 * This function scans the data directory and runs the `migrate` function on the
 * data of each file, writing the result back into the same file.
 *
 * @example
 * ```ts
 * await migrateData<OldFields, NewFields>({
 *   config: recipeConfig,
 *   migrate: (recipeData: OldFields) => NewFields | undefined;
 * });
 * ```
 */
export async function migrateData<
  TData = Record<string, unknown>,
  TTransformedData = TData,
>(
  config: ContentTypeConfig<TData>,
  migrate: (data: TData) => TTransformedData | Promise<TTransformedData>,
): Promise<void> {
  const contentDirectory = getContentDirectory();
  const dataDirectory = getDataDirectory(
    config as ContentTypeConfig,
    contentDirectory,
  );

  // Scan data directory and rebuild
  if (!(await exists(dataDirectory))) {
    console.warn(`Data directory ${dataDirectory} does not exist!`);
    return;
  }

  let slugDirectories: string[];
  try {
    slugDirectories = await readdir(dataDirectory);
  } catch (e) {
    console.error(`Failed to read ${dataDirectory}`, e);
    return;
  }

  for (const slug of slugDirectories) {
    try {
      const data = await readContentFromFilesystem<TData>(
        config as unknown as ContentTypeConfig<TData>,
        slug,
        contentDirectory,
      );
      const changedData = await migrate(data);
      if (changedData !== undefined) {
        await writeContentToFilesystem<TTransformedData>(
          config as unknown as ContentTypeConfig<TTransformedData>,
          slug,
          changedData,
        );
      }
    } catch (e) {
      // Skip entries that fail to read
      console.warn(`Failed to migrate ${config.contentType} at ${slug}:`, e);
    }
  }
}
