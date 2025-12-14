import Link from "next/link";
import { notFound } from "next/navigation";
import { readContentFile } from "content-engine/content/readContentFile";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { noteConfig, type Note } from "@/lib/notes";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ViewNotePage({ params }: Props) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: "0 0 5px" }}>{note.title}</h2>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            {new Date(note.date).toLocaleString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href={`/notes/${slug}/edit`}
            style={{
              backgroundColor: "#0070f3",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              textDecoration: "none"
            }}
          >
            Edit
          </Link>
          <Link
            href={`/notes/${slug}/delete`}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              textDecoration: "none"
            }}
          >
            Delete
          </Link>
        </div>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          {note.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-block",
                backgroundColor: "#f0f0f0",
                padding: "4px 8px",
                borderRadius: "4px",
                marginRight: "5px",
                fontSize: "14px"
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "4px",
          whiteSpace: "pre-wrap",
          lineHeight: "1.6"
        }}
      >
        {note.content || <em style={{ color: "#999" }}>No content</em>}
      </div>

      <div style={{ marginTop: "20px" }}>
        <Link href="/" style={{ color: "#0070f3" }}>
          &larr; Back to all notes
        </Link>
      </div>
    </div>
  );
}
