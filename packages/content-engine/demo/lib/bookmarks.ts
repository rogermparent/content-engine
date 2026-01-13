import type { ContentTypeConfig } from "content-engine/content/types";
import { z } from "zod";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

// Bookmark data schema - references a note by slug
export interface Bookmark {
  note: string; // Note slug reference
  label: string;
  date: number;
}

// Index value (subset of Bookmark for fast querying)
export interface BookmarkIndexValue {
  note: string;
  label: string;
  date: number;
}

// Index key: [date, slug] for sorting by date
export type BookmarkIndexKey = [number, string];

// Content type configuration
export const bookmarkConfig: ContentTypeConfig<
  Bookmark,
  BookmarkIndexValue,
  BookmarkIndexKey
> = {
  contentType: "bookmarks",
  dataDirectory: "bookmarks/data",
  indexDirectory: "bookmarks/index",
  dataFilename: "bookmark.json",
  buildIndexValue: (data: Bookmark): BookmarkIndexValue => ({
    note: data.note,
    label: data.label,
    date: data.date,
  }),
  buildIndexKey: (slug: string, data: Bookmark): BookmarkIndexKey => [
    data.date,
    slug,
  ],
};

// Zod schema for form validation
export const bookmarkFormSchema = z.object({
  note: z.string().min(1, "Note is required"),
  label: z.string().min(1, "Label is required"),
  slug: z.string().nullish(),
  date: dateEpochSchema.nullish(),
});

export type BookmarkFormData = z.infer<typeof bookmarkFormSchema>;

// Helper to convert form data to Bookmark
export function formDataToBookmark(
  formData: BookmarkFormData,
  existingDate?: number,
): Bookmark {
  const date =
    typeof formData.date === "number" ? formData.date : null;
  return {
    note: formData.note,
    label: formData.label,
    date: date ?? existingDate ?? Date.now(),
  };
}

// Helper to generate slug from label
export function generateBookmarkSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
