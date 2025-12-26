"use client";

import { useSyncExternalStore } from "react";
import type { Note } from "@/lib/notes";

interface NoteFormProps {
  note?: Note;
  slug?: string;
  submitLabel: string;
  cancelHref: string;
}

function getTimezone() {
  return typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined;
}

function subscribe() {
  return () => {};
}

export function NoteForm({ note, slug, submitLabel, cancelHref }: NoteFormProps) {
  const currentTimezone = useSyncExternalStore(subscribe, getTimezone, () => undefined);

  const dateValue = note?.date;
  const dateObject = dateValue ? new Date(dateValue) : undefined;
  // Format as YYYY-MM-DDTHH:mm for datetime-local input compatibility
  const defaultDateValue = dateObject?.toISOString().slice(0, 16);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      {slug && (
        <>
          <input type="hidden" name="currentSlug" value={slug} />
          <input type="hidden" name="currentDate" value={note?.date ?? ""} />
        </>
      )}

      <div>
        <label htmlFor="title" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={note?.title}
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
          Slug{slug ? "" : " (optional, auto-generated from title)"}
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
          defaultValue={note?.content}
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
          defaultValue={note?.tags?.join(", ") ?? ""}
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

      <div>
        <label htmlFor="date" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
          Date (UTC)
        </label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          step="any"
          defaultValue={defaultDateValue}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "16px"
          }}
        />
        {currentTimezone && dateObject && (
          <div style={{ fontSize: "12px", fontStyle: "italic", marginTop: "4px", color: "#666" }}>
            {dateObject.toLocaleString()} ({currentTimezone})
          </div>
        )}
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
          {submitLabel}
        </button>
        <a
          href={cancelHref}
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
    </div>
  );
}
