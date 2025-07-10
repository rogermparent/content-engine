"use server";

import { rm } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPageDirectory } from "../filesystemDirectories";

export default async function deletePage(slug: string) {
  const pageDirectory = getPageDirectory(slug);
  await rm(pageDirectory, { recursive: true });
  revalidatePath("/" + slug);
  revalidatePath("/pages");
  redirect("/pages");
}
