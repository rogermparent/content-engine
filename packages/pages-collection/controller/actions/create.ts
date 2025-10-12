"use server";

import parsePageFormData from "../parseFormData";
import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageFormState } from "../formState";
import { Page } from "../types";
import { getPageDirectory } from "../filesystemDirectories";
import createDefaultSlug from "../createSlug";
import { outputJson } from "fs-extra";
import { join } from "path";
import z from "zod";

export default async function createPage(
  _prevState: PageFormState,
  formData: FormData,
) {
  const validatedFields = parsePageFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: "Failed to create Page.",
    };
  }

  const {
    date: givenDate,
    slug: givenSlug,
    name,
    content,
  } = validatedFields.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || createDefaultSlug(validatedFields.data));

  const data: Page = {
    name,
    date,
    content,
  };

  const baseDirectory = getPageDirectory(slug);
  await outputJson(join(baseDirectory, "page.json"), data);

  const resultPath = "/" + slug;
  revalidatePath(resultPath);
  revalidatePath("/pages");
  redirect(resultPath);
}
