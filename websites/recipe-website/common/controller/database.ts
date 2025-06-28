import { open } from "lmdb";
import { getRecipeIndexDirectory } from "./filesystemDirectories";
import { RecipeEntryKey, RecipeEntryValue } from "./types";

export default function getRecipeDatabase(contentDirectory?: string) {
  return open<RecipeEntryValue, RecipeEntryKey>({
    path: getRecipeIndexDirectory(contentDirectory),
  });
}
