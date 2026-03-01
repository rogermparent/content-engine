"use server";

import { revalidatePath } from "next/cache";
import { resumeContentConfig } from "../resumeContentConfig";
import { rebuildIndex } from "content-engine/content/rebuildIndex";

export default async function rebuildResumeIndex() {
  await rebuildIndex({ config: resumeContentConfig });
  revalidatePath("/");
}
