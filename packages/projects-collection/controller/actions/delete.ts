"use server";

import { rm } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProjectDirectory } from "../filesystemDirectories";

export default async function deleteProject(slug: string) {
  const projectDirectory = getProjectDirectory(slug);
  await rm(projectDirectory, { recursive: true });
  revalidatePath("/" + slug);
  revalidatePath("/projects");
  redirect("/projects");
}
