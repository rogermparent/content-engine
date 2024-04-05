"use server";

import { rename, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parsePageFormData from "../parseFormData";
import { PageFormState } from "../formState";
import { getPageDirectory, getPageFilePath } from "../filesystemDirectories";
import { Page } from "../types";
import createDefaultSlug from "../createSlug";
import slugify from "@sindresorhus/slugify";
import writePageFiles, { getPageFileInfo } from "../writeUpload";
import getPageBySlug from "../data/read";

export default async function updatePage(
  currentDate: number,
  currentSlug: string,
  _prevState: PageFormState,
  formData: FormData,
) {
  const validatedFields = parsePageFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update Page.",
    };
  }

  const { date, slug, name, content } = validatedFields.data;

  const currentPageDirectory = getPageDirectory(currentSlug);
  const currentPagePath = getPageFilePath(currentPageDirectory);
  const currentPageData = await getPageBySlug(currentSlug);

  const finalSlug = slugify(slug || createDefaultSlug(validatedFields.data));
  const finalDate = date || currentDate || Date.now();
  const finalPageDirectory = getPageDirectory(finalSlug);

  const willRename = currentPageDirectory !== finalPageDirectory;

  const imageData = await getPageFileInfo(
    validatedFields.data,
    currentPageData,
  );
  const { imageName } = imageData;

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

  await writePageFiles(finalPageDirectory, imageData);

  if (willRename) {
    revalidatePath("/" + currentSlug);
  }
  revalidatePath("/" + finalSlug);
  redirect("/" + finalSlug);
}
