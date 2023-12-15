"use server";

import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Post,
  getPostDatabase,
  getPostDirectory,
  getPostFilePath,
  getPostIndexEntryValue,
  getPostUploadsDirectory,
  reloadPostsDatabase,
} from "./data";
import slugify from "@sindresorhus/slugify";
import { createWriteStream } from "fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";
import { z } from "zod";
import path from "path";
import { auth, signIn } from "@/auth";

const FormSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  body: z.string().optional(),
  image: z.instanceof(File).optional(),
  date: z
    .union([
      z.enum([""]),
      z.string().transform((value, ctx) => {
        const epoch = Date.parse(`${value}Z`);
        if (Number.isNaN(epoch)) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_date,
          });
          return z.NEVER;
        }
        return epoch;
      }),
    ])
    .optional(),
  slug: z.string().optional(),
});

async function mkdirIfNeeded(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    if ((e as { code: string }).code !== "EEXIST") {
      throw e;
    }
  }
}

async function mkdirIfNotPresent(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    if ((e as { code: string }).code === "EEXIST") {
      throw new Error("Post already exists");
    } else {
      throw e;
    }
  }
}

export interface StateErrors {
  title?: string[];
  body?: string[];
  summary?: string[];
  image?: string[];
  date?: string[];
  slug?: string[];
}

export type State = {
  errors?: StateErrors;
  message: string;
};

async function writePostUpload(postBaseDirectory: string, file: File) {
  await mkdirIfNeeded(getPostUploadsDirectory(postBaseDirectory));

  const fileWriteStream = createWriteStream(
    `${postBaseDirectory}/uploads/${file.name}`,
  );
  const readStream = Readable.fromWeb(file.stream() as ReadableStream<any>);
  await pipeline(readStream, fileWriteStream);
}

export async function createPost(_prevState: State, formData: FormData) {
  const user = await auth();
  if (!user) {
    return signIn();
  }

  const validatedFields = FormSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    summary: formData.get("summary"),
    image: formData.get("image"),
    date: formData.get("date"),
    slug: formData.get("slug"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to create Post.",
    };
  }

  const {
    date: givenDate,
    slug: givenSlug,
    title,
    body,
    summary,
    image,
  } = validatedFields.data;

  const date: number = givenDate || (Date.now() as number);
  const slug = slugify(givenSlug || title);
  const hasImage = image && image.size > 0;
  const data: Post = {
    image: hasImage ? image.name : undefined,
    summary,
    title,
    body,
    date,
  };
  const postBaseDirectory = getPostDirectory(slug);
  await mkdirIfNotPresent(postBaseDirectory);
  await writeFile(getPostFilePath(postBaseDirectory), JSON.stringify(data));
  if (hasImage) {
    await writePostUpload(postBaseDirectory, image);
  }
  const db = getPostDatabase();
  try {
    await db.put([date, slug], getPostIndexEntryValue(data));
  } catch (e) {
    return { message: "Failed to write post" };
  } finally {
    db.close();
  }
  revalidatePath("/post/" + slug);
  revalidatePath("/posts");
  revalidatePath("/posts/[page]", "page");
  revalidatePath("/");
  redirect("/post/" + slug);
}

export async function updatePost(
  currentDate: number,
  currentSlug: string,
  _prevState: State,
  formData: FormData,
) {
  const user = await auth();
  if (!user) {
    return signIn();
  }

  const validatedFields = FormSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    summary: formData.get("summary"),
    image: formData.get("image"),
    date: formData.get("date"),
    slug: formData.get("slug"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update Post.",
    };
  }

  const { date, slug, title, body, summary, image } = validatedFields.data;

  const currentPostDirectory = getPostDirectory(currentSlug);
  const currentPostPath = getPostFilePath(currentPostDirectory);

  const finalSlug = slug || currentSlug;
  const finalDate = date || currentDate;
  const finalPostDirectory = getPostDirectory(finalSlug);

  const willRename = currentPostDirectory !== finalPostDirectory;
  const willChangeDate = date && currentDate !== date;

  const currentData = JSON.parse(String(await readFile(currentPostPath)));
  const hasNewImage = image && image.size > 0;

  const data: Post = {
    title,
    summary,
    body,
    date: finalDate,
    image: hasNewImage ? image.name : currentData.image,
  };

  if (willRename) {
    await rename(currentPostDirectory, finalPostDirectory);
    await writeFile(`${finalPostDirectory}/post.json`, JSON.stringify(data));
  } else {
    await writeFile(currentPostPath, JSON.stringify(data));
  }
  const db = getPostDatabase();
  try {
    if (willRename || willChangeDate) {
      db.remove([currentDate, currentSlug]);
    }
    db.put([finalDate, finalSlug], getPostIndexEntryValue(data));
  } catch (e) {
    return { message: "Failed to write post to index" };
  } finally {
    db.close();
  }
  if (hasNewImage) {
    const rmPromise =
      currentData.image &&
      rm(
        path.join(
          getPostUploadsDirectory(finalPostDirectory),
          currentData.image,
        ),
      );
    await rmPromise;
    await writePostUpload(finalPostDirectory, image);
  }
  if (willRename) {
    revalidatePath("/post/" + currentSlug);
  }
  revalidatePath("/post/" + finalSlug);
  revalidatePath("/");
  redirect("/post/" + finalSlug);
}

export async function deletePost(
  date: number,
  slug: string,
  _formData: FormData,
) {
  const user = await auth();
  if (!user) {
    return signIn();
  }

  const db = getPostDatabase();
  const postDirectory = getPostDirectory(slug);
  try {
    await rm(postDirectory, { recursive: true });
    await db.remove([date, slug]);
    revalidatePath("/post/" + slug);
    revalidatePath("/");
    redirect("/");
  } catch (e) {
    throw e;
  } finally {
    db.close();
  }
}

export async function reloadPosts() {
  await reloadPostsDatabase();
  revalidatePath("/");
}
