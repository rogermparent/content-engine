import { Key } from "lmdb";
import { getContentDirectory } from "../fs/getContentDirectory";
import { readContentFromFilesystem } from "./filesystem";
import type { ContentTypeConfig, ReadContentFileOptions } from "./types";

/**
 * Read a single content file from the filesystem by slug
 *
 * @example
 * ```ts
 * const recipe = await readContentFile({
 *   config: recipeConfig,
 *   slug: "chocolate-cake",
 * });
 * ```
 */
export async function readContentFile<
  TData extends Record<string, unknown>,
  TIndexValue,
  TKey extends Key,
>(options: ReadContentFileOptions<TData, TIndexValue, TKey>): Promise<TData> {
  const { config, slug, contentDirectory: providedContentDirectory } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();

  return readContentFromFilesystem<TData>(
    config as ContentTypeConfig<TData>,
    slug,
    contentDirectory,
  );
}

export default readContentFile;
