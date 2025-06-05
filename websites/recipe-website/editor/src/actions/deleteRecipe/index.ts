"use server";

import { auth, signIn } from "@/auth";
import deleteRecipe from "recipe-editor/controller/actions/delete";

export default async function authenticateAndDeleteRecipe(
  currentDate: number,
  currentSlug: string,
) {
  const user = await auth();
  if (!user) {
    return signIn();
  }
  return deleteRecipe(currentDate, currentSlug);
}
