"use server";

import { auth, signIn } from "@/auth";
import updateRecipe from "recipe-editor/controller/actions/update";
import { RecipeFormState } from "recipe-website-common/controller/formState";

export default async function authenticateAndUpdateRecipe(
  currentDate: number,
  currentSlug: string,
  _prevState: RecipeFormState,
  formData: FormData,
) {
  const user = await auth();
  if (!user) {
    return signIn();
  }
  return updateRecipe(currentDate, currentSlug, _prevState, formData);
}
