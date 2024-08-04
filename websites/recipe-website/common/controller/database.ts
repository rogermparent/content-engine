import { open } from "lmdb";
import { recipeIndexDirectory } from "./filesystemDirectories";
import { RecipeEntryKey, RecipeEntryValue } from "./types";

export default function getRecipeDatabase() {
  return open<RecipeEntryValue, RecipeEntryKey>({
    path: recipeIndexDirectory,
  });
}
