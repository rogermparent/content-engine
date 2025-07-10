"use server";

import { rename, writeFile } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parseProjectFormData from "../parseFormData";
import { ProjectFormState } from "../formState";
import {
  getProjectDirectory,
  getProjectFilePath,
} from "../filesystemDirectories";
import { Project } from "../types";
import createDefaultSlug from "../createSlug";
import slugify from "@sindresorhus/slugify";

export default async function updateProject(
  currentSlug: string,
  _prevState: ProjectFormState,
  formData: FormData,
) {
  const validatedFields = parseProjectFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update Project.",
    };
  }

  const { date, slug, name, content } = validatedFields.data;

  const currentProjectDirectory = getProjectDirectory(currentSlug);
  const currentProjectPath = getProjectFilePath(currentProjectDirectory);

  const finalSlug = slugify(slug || createDefaultSlug(validatedFields.data));
  const finalDate = date || Date.now();
  const finalProjectDirectory = getProjectDirectory(finalSlug);

  const willRename = currentProjectDirectory !== finalProjectDirectory;

  const data: Project = {
    name,
    content,
    date: finalDate,
  };

  if (willRename) {
    await rename(currentProjectDirectory, finalProjectDirectory);
    await writeFile(
      `${finalProjectDirectory}/project.json`,
      JSON.stringify(data),
    );
  } else {
    await writeFile(currentProjectPath, JSON.stringify(data));
  }

  if (willRename) {
    revalidatePath("/" + currentSlug);
  }
  revalidatePath("/" + finalSlug);
  redirect("/" + finalSlug);
}
