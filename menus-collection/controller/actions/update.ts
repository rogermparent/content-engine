"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parseMenuFormData from "../parseFormData";
import { MenuFormState } from "../formState";
import { getMenuDirectory } from "../filesystemDirectories";
import { Menu } from "../types";
import { outputJson } from "fs-extra";
import { join } from "path";

export default async function updateMenu(
  currentSlug: string,
  _prevState: MenuFormState,
  formData: FormData,
) {
  const validatedFields = parseMenuFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update Menu.",
    };
  }

  const { items } = validatedFields.data;

  const baseDirectory = getMenuDirectory(currentSlug);

  const data: Menu = {
    items,
  };

  await outputJson(join(baseDirectory, "menu.json"), data);

  revalidatePath("/" + currentSlug);
  redirect("/menus");
}
