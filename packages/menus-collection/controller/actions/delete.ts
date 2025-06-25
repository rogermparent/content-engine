"use server";

import { rm } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMenuDirectory } from "../filesystemDirectories";

export default async function deleteMenu(slug: string) {
  const menuDirectory = getMenuDirectory(slug);
  await rm(menuDirectory, { recursive: true });
  revalidatePath("/" + slug);
  revalidatePath("/menus");
  redirect("/menus");
}
