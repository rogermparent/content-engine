"use server";

import parseProjectFormData from "../parseFormData";
import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProjectFormState } from "../formState";
import { Project } from "../types";
import { getProjectDirectory } from "../filesystemDirectories";
import createDefaultSlug from "../createSlug";
import { outputJson } from "fs-extra";
import { join } from "path";
import z from "zod";

export default async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
) {
  const validatedFields = parseProjectFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: "Failed to create Project.",
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

  const data: Project = {
    name,
    date,
    content,
  };

  const baseDirectory = getProjectDirectory(slug);
  await outputJson(join(baseDirectory, "project.json"), data);

  const resultPath = "/" + slug;
  revalidatePath(resultPath);
  revalidatePath("/projects");
  redirect(resultPath);
}
