import { redirect, notFound } from "next/navigation";
import { readContentFile } from "content-engine/content/readContentFile";
import { updateContent } from "content-engine/content/updateContent";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { noteConfig, noteFormSchema, formDataToNote, generateSlug, type Note, type NoteIndexKey } from "@/lib/notes";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function updateNote(formData: FormData) {
  "use server";

  const currentSlug = formData.get("currentSlug") as string;
  const currentDate = parseInt(formData.get("currentDate") as string, 10);

  const rawData = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    slug: formData.get("slug") as string,
    tags: formData.get("tags") as string,
  };

  const parsed = noteFormSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("Invalid form data: " + parsed.error.message);
  }

  const newSlug = parsed.data.slug || generateSlug(parsed.data.title);
  const note = formDataToNote(parsed.data, currentDate);
  const contentDirectory = getContentDirectory();
  const currentIndexKey: NoteIndexKey = [currentDate, currentSlug];

  await updateContent({
    config: noteConfig,
    slug: newSlug,
    currentSlug,
    currentIndexKey,
    data: note,
    contentDirectory,
    commitMessage: `Update note: ${note.title}`,
  });

  redirect(`/notes/${newSlug}`);
}

export default async function EditNotePage({ params }: Props) {
  const { slug } = await params;
  const contentDirectory = getContentDirectory();

  let note: Note;
  try {
    note = await readContentFile<Note>({
      config: noteConfig,
      slug,
      contentDirectory,
    });
  } catch {
    notFound();
  }

  return (
    <div>
      <h2>Edit Note</h2>
      <form action={updateNote} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input type="hidden" name="currentSlug" value={slug} />
        <input type="hidden" name="currentDate" value={note.date} />

        <div>
          <label htmlFor="title" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={note.title}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>

        <div>
          <label htmlFor="slug" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Slug
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            defaultValue={slug}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>

        <div>
          <label htmlFor="content" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            defaultValue={note.content}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px",
              resize: "vertical"
            }}
          />
        </div>

        <div>
          <label htmlFor="tags" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            defaultValue={note.tags?.join(", ") ?? ""}
            placeholder="tag1, tag2, tag3"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#0070f3",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Update Note
          </button>
          <a
            href={`/notes/${slug}`}
            style={{
              padding: "10px 20px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textDecoration: "none",
              color: "#333",
              display: "inline-block"
            }}
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
