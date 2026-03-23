"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parseResumeFormData from "../parseFormData";
import { ResumeFormState } from "../formState";
import type { Resume, ResumeEntryKey } from "../types";
import { resumeContentConfig } from "../resumeContentConfig";
import { updateContent } from "@discontent/cms/content/updateContent";
import z from "zod";

export default async function updateResume(
  currentDate: number,
  currentSlug: string,
  _prevState: ResumeFormState,
  formData: FormData,
) {
  const validatedFields = parseResumeFormData(formData);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: "Failed to update Resume.",
    };
  }

  const { date, slug, ...rest } = validatedFields.data;

  const finalSlug =
    slug ||
    resumeContentConfig.createDefaultSlug!({
      ...rest,
      date: date || currentDate,
    });
  const finalDate = date || currentDate;
  const currentIndexKey: ResumeEntryKey = [currentDate, currentSlug];

  const data: Resume = { ...rest, date: finalDate };

  await updateContent({
    config: resumeContentConfig,
    slug: finalSlug,
    currentSlug,
    currentIndexKey,
    data,
    commitMessage: `Update resume: ${finalSlug}`,
  });

  if (currentSlug !== finalSlug) {
    revalidatePath("/resume/" + currentSlug);
  }
  revalidatePath("/resume/" + finalSlug);
  revalidatePath("/");
  redirect("/resume/" + finalSlug);
}
