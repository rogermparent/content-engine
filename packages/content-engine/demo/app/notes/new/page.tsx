import { redirect } from "next/navigation";
import { createContent } from "content-engine/content/createContent";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { noteConfig, noteFormSchema, formDataToNote, generateSlug } from "@/lib/notes";

export const dynamic = "force-dynamic";

async function createNote(formData: FormData) {
  "use server";

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

  const slug = parsed.data.slug || generateSlug(parsed.data.title);
  const note = formDataToNote(parsed.data);
  const contentDirectory = getContentDirectory();

  await createContent({
    config: noteConfig,
    slug,
    data: note,
    contentDirectory,
    commitMessage: `Create note: ${note.title}`,
  });

  redirect(`/notes/${slug}`);
}

export default function NewNotePage() {
  return (
    <div>
      <h2>Create New Note</h2>
      <form action={createNote} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label htmlFor="title" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
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
            Slug (optional, auto-generated from title)
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
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
            Create Note
          </button>
          <a
            href="/"
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
