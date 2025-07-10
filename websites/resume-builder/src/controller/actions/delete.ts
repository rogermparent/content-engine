"use server";

import { rm } from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import getResumeDatabase from "../database";
import { getResumeDirectory } from "../filesystemDirectories";
import { commitContentChanges } from "content-engine/git/commit";

async function removeFromDatabase(date: number, slug: string) {
  const db = getResumeDatabase();
  try {
    await db.remove([date, slug]);
  } catch {
    throw new Error("Failed to remove resume from index");
  } finally {
    db.close();
  }
}

export default async function deleteResume(date: number, slug: string) {
  const resumeDirectory = getResumeDirectory(slug);
  await rm(resumeDirectory, { recursive: true });

  await removeFromDatabase(date, slug);
  await commitContentChanges(`Delete resume: ${slug}`);

  revalidatePath("/resume/" + slug);
  revalidatePath("/");
  redirect("/");
}
