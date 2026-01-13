import Link from "next/link";
import { notFound } from "next/navigation";
import { readContentFile } from "content-engine/content/readContentFile";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import {
  bookmarkConfig,
  BookmarkIndexKey,
  BookmarkIndexValue,
  type Bookmark,
} from "@/lib/bookmarks";
import {
  noteConfig,
  NoteIndexKey,
  NoteIndexValue,
  type Note,
} from "@/lib/notes";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookmarkPage({ params }: PageProps) {
  const { slug } = await params;
  const contentDirectory = getContentDirectory();

  let bookmark: Bookmark;
  try {
    bookmark = await readContentFile<
      Bookmark,
      BookmarkIndexValue,
      BookmarkIndexKey
    >({
      config: bookmarkConfig,
      slug,
      contentDirectory,
    });
  } catch {
    notFound();
  }

  // Try to fetch the referenced note
  let note: Note | null = null;
  try {
    note = await readContentFile<Note, NoteIndexValue, NoteIndexKey>({
      config: noteConfig,
      slug: bookmark.note,
      contentDirectory,
    });
  } catch {
    // Note may not exist
  }

  return (
    <div>
      <Link
        href="/"
        style={{ color: "#0070f3", marginBottom: "20px", display: "block" }}
      >
        &larr; Back to all notes
      </Link>

      <h1>{bookmark.label}</h1>

      <p style={{ color: "#666", marginBottom: "20px" }}>
        References note: <strong>{bookmark.note}</strong>
      </p>

      {note ? (
        <p>
          <Link href={`/notes/${bookmark.note}`} style={{ color: "#0070f3" }}>
            View Note: {note.title}
          </Link>
        </p>
      ) : (
        <p style={{ color: "#999" }}>Referenced note not found</p>
      )}

      <p style={{ color: "#999", fontSize: "14px" }}>
        Created: {new Date(bookmark.date).toLocaleString()}
      </p>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <Link
          href={`/bookmarks/${slug}/edit`}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            textDecoration: "none",
            color: "#333",
          }}
        >
          Edit
        </Link>
        <Link
          href={`/bookmarks/${slug}/delete`}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fee",
            borderRadius: "4px",
            textDecoration: "none",
            color: "#c00",
          }}
        >
          Delete
        </Link>
      </div>
    </div>
  );
}
