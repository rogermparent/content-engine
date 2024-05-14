"use server";
import parseFormData from "content-engine/forms/parseFormData";
import { createWriteStream, ensureDir, outputJson, readJson } from "fs-extra";
import { redirect } from "next/navigation";
import { z } from "zod";
import { homepageContentFilePath, uploadsDirectory } from "./paths";
import { join } from "node:path";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { HomepageContent } from "./types";

const HomepageFormSchema = z.object({
  title: z.string(),
  about: z.string(),
  contactSectionTitle: z.string(),
  projects: z.optional(
    z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        image: z.instanceof(File).optional(),
        existingImage: z.string().optional(),
        links: z.optional(
          z.array(z.object({ label: z.string(), link: z.string() })),
        ),
      }),
    ),
  ),
  contactLinks: z.optional(
    z.array(
      z.object({
        label: z.string(),
        link: z.string(),
        icon: z.string(),
        iconType: z.enum(["inlineSvg", "text"]).optional(),
      }),
    ),
  ),
});

export type ParsedHomepageFormData = z.infer<typeof HomepageFormSchema>;

export async function getHomepageContent(): Promise<
  HomepageContent | undefined
> {
  try {
    const homepageContent = await readJson(homepageContentFilePath);
    return homepageContent;
  } catch {
    return undefined;
  }
}

async function getImageValue({
  image,
  existingImage,
  clearImage,
}: {
  image?: File;
  existingImage?: string | undefined;
  clearImage?: boolean | undefined;
}) {
  if (image && image.size > 0) {
    const { name } = image;
    await ensureDir(uploadsDirectory);
    const imageWriteStream = createWriteStream(join(uploadsDirectory, name));
    const readStream = Readable.fromWeb(image.stream() as ReadableStream<any>);
    await pipeline(readStream, imageWriteStream);
    return name;
  } else {
    return (!clearImage && existingImage) || undefined;
  }
}

export async function writeHomepageContent(formData: FormData) {
  const { success, data } = parseFormData<ParsedHomepageFormData>(
    formData,
    HomepageFormSchema,
  );

  if (success) {
    const { projects, contactLinks, title, about, contactSectionTitle } = data;
    const processedProjects = projects
      ? await Promise.all(
          projects.map(async (project) => {
            const { name, description, links } = project;
            return {
              name,
              description,
              links,
              image: await getImageValue(project),
            };
          }),
        )
      : undefined;
    const processedData = {
      title,
      about,
      projects: processedProjects,
      contactLinks,
      contactSectionTitle,
    };
    await outputJson(homepageContentFilePath, processedData);
    redirect("/");
  }
}
