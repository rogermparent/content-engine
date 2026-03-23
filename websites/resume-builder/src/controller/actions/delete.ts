"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resumeContentConfig } from "../resumeContentConfig";
import { deleteContent } from "@discontent/cms/content/deleteContent";
import type { ResumeEntryKey } from "../types";

export default async function deleteResume(date: number, slug: string) {
  const indexKey: ResumeEntryKey = [date, slug];
  await deleteContent({
    config: resumeContentConfig,
    slug,
    indexKey,
    commitMessage: `Delete resume: ${slug}`,
  });

  revalidatePath("/resume/" + slug);
  revalidatePath("/");
  redirect("/");
}
