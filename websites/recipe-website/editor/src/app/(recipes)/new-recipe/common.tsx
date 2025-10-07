import {
  ImportedRecipe,
  importRecipeData,
} from "recipe-website-common/util/importRecipeData";

export interface RecipeActionState {
  message?: string;
  error?: Error;
  recipe?: Partial<ImportedRecipe>;
}

export async function reduceRecipeImport(
  _state: RecipeActionState | null,
  url: string | null,
) {
  if (!url) {
    return { message: "No URL provided" };
  }
  try {
    if (typeof url === "string") {
      return { recipe: await importRecipeData(url) };
    } else {
      return { message: "Invalid URL provided" };
    }
  } catch (e: unknown) {
    const message = typeof e === "string" ? e : (e as Error)?.message;
    if (message) {
      return { message };
    }
    return { message: "Unknown error occurred!" };
  }
}
