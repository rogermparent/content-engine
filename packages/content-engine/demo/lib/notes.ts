import type { ContentTypeConfig } from "content-engine/content/types";
import { z } from "zod";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

// Note data schema
export interface Note {
  title: string;
  content: string;
  date: number;
  tags?: string[];
}

// Index value (subset of Note for fast querying)
export interface NoteIndexValue {
  title: string;
  date: number;
}

// Index key: [date, slug] for sorting by date
export type NoteIndexKey = [number, string];

// Content type configuration
export const noteConfig: ContentTypeConfig<Note, NoteIndexValue, NoteIndexKey> = {
  contentType: "notes",
  dataDirectory: "notes/data",
  indexDirectory: "notes/index",
  dataFilename: "note.json",
  buildIndexValue: (data: Note): NoteIndexValue => ({
    title: data.title,
    date: data.date,
  }),
  buildIndexKey: (slug: string, data: Note): NoteIndexKey => [data.date, slug],
};

// Zod schema for form validation
export const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  slug: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  date: dateEpochSchema.optional(),
});

export type NoteFormData = z.infer<typeof noteFormSchema>;

// Helper to convert form data to Note
export function formDataToNote(formData: NoteFormData, existingDate?: number): Note {
  const date = typeof formData.date === "number" ? formData.date : undefined;
  return {
    title: formData.title,
    content: formData.content,
    date: date ?? existingDate ?? Date.now(),
    tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
  };
}

// Helper to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
