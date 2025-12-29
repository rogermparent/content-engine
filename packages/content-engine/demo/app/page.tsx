import Link from "next/link";
import { readContentIndex } from "content-engine/content/readContentIndex";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import {
  noteConfig,
  type NoteIndexValue,
  type NoteIndexKey,
} from "@/lib/notes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const contentDirectory = getContentDirectory();

  const result = await readContentIndex<NoteIndexValue, NoteIndexKey>({
    config: noteConfig,
    contentDirectory,
    reverse: true, // Newest first
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Notes</h2>
        <Link
          href="/notes/new"
          style={{
            backgroundColor: "#0070f3",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          Create New Note
        </Link>
      </div>

      {result.entries.length === 0 ? (
        <p style={{ color: "#666" }}>No notes yet. Create your first note!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {result.entries.map((entry) => {
            const [, slug] = entry.key;
            return (
              <li
                key={slug}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <Link
                  href={`/notes/${slug}`}
                  style={{
                    textDecoration: "none",
                    color: "#0070f3",
                    fontSize: "18px",
                    fontWeight: "500",
                  }}
                >
                  {entry.value.title}
                </Link>
                <p
                  style={{ color: "#666", fontSize: "14px", margin: "5px 0 0" }}
                >
                  {new Date(entry.value.date).toLocaleString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
        Total notes: {result.total}
      </p>
    </div>
  );
}
