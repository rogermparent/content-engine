"use server";

import { RecipeActionState, reduceRecipeImport } from "./common";

export async function importRecipeAction(
  _previousState: RecipeActionState | null,
  formData: FormData,
): Promise<RecipeActionState> {
  const url = formData.get("import");
  return await reduceRecipeImport(
    _previousState,
    typeof url === "string" ? url : null,
  );
}
