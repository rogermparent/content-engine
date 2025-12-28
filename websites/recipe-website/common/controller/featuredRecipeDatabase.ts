import { open } from "lmdb";
import { getFeaturedRecipeIndexDirectory } from "./filesystemDirectories";
import { FeaturedRecipeEntryKey, FeaturedRecipeEntryValue } from "./types";

export default function getFeaturedRecipeDatabase(contentDirectory?: string) {
  return open<FeaturedRecipeEntryValue, FeaturedRecipeEntryKey>({
    path: getFeaturedRecipeIndexDirectory(contentDirectory),
  });
}
