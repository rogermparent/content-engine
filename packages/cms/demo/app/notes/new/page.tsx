import { redirect } from "next/navigation";
import { createContent } from "@discontent/cms/content/createContent";
import { revalidatePaginationResults } from "@discontent/cms/pagination/next/revalidate";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import {
  noteConfig,
  noteFormSchema,
  formDataToNote,
  generateSlug,
} from "@/lib/notes";
import { NoteForm } from "../form";

export const dynamic = "force-dynamic";

async function createNote(formData: FormData) {
  "use server";

  const rawData = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    slug: formData.get("slug") as string,
    tags: formData.get("tags") as string,
    date: formData.get("date") as string,
  };

  const parsed = noteFormSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("Invalid form data: " + parsed.error.message);
  }

  const slug = parsed.data.slug || generateSlug(parsed.data.title);
  const note = formDataToNote(parsed.data);
  const contentDirectory = getContentDirectory();

  const { pagination } = await createContent({
    config: noteConfig,
    slug,
    data: note,
    contentDirectory,
    commitMessage: `Create note: ${note.title}`,
  });

  /*
   * This demo calls the write functions directly rather than through
   * `createGenericActions`, so it invalidates for itself. For a create that is
   * two tags — the landing and the meta record — and every sealed page keeps
   * its cache entry.
   */
  revalidatePaginationResults(noteConfig.contentType, pagination);

  redirect(`/notes/${slug}`);
}

export default function NewNotePage() {
  return (
    <div>
      <h2>Create New Note</h2>
      <form action={createNote}>
        <NoteForm submitLabel="Create Note" cancelHref="/" />
      </form>
    </div>
  );
}
