"use server";

import { rename, writeFile } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parsePageFormData from "../parseFormData";
import { PageFormState } from "../formState";
import { getPageDirectory, getPageFilePath } from "../filesystemDirectories";
import { Page } from "../types";
import createDefaultSlug from "../createSlug";
import slugify from "@sindresorhus/slugify";
import z from "zod";

export default async function updatePage(
  currentSlug: string,
  _prevState: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const validatedFields = parsePageFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: "Failed to update Page.",
    };
  }

  const { date, slug, name, content } = validatedFields.data;

  const currentPageDirectory = getPageDirectory(currentSlug);
  const currentPagePath = getPageFilePath(currentPageDirectory);

  const finalSlug = slugify(slug || createDefaultSlug(validatedFields.data));
  const finalDate = date || Date.now();
  const finalPageDirectory = getPageDirectory(finalSlug);

  const willRename = currentPageDirectory !== finalPageDirectory;

  const data: Page = {
    name,
    content,
    date: finalDate,
  };

  if (willRename) {
    await rename(currentPageDirectory, finalPageDirectory);
    await writeFile(`${finalPageDirectory}/page.json`, JSON.stringify(data));
  } else {
    await writeFile(currentPagePath, JSON.stringify(data));
  }

  if (willRename) {
    revalidatePath("/" + currentSlug);
  }
  revalidatePath("/" + finalSlug);
  redirect("/" + finalSlug);
}
