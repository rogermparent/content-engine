import type { PaginationIndexConfig } from "@discontent/cms/pagination/types";
import type { NoteIndexKey, NoteIndexValue } from "./notes";

/**
 * What one row of a paginated note list renders. Stored inline in the paged
 * keyspace, so reading a page needs no further lookups.
 */
export interface NoteListItem {
  slug: string;
  title: string;
  date: number;
}

/**
 * Notes by date, newest first.
 *
 * Its own module rather than a field inside `notes.ts`: the content config
 * imports this, and this imports only *types* back, so there is no cycle.
 *
 * `perPage` is small on purpose. At 4, a 14-note fixture spans four pages with
 * a partial head — enough for the tests to see sealing, folding and page
 * removal without a fixture that takes a minute to generate.
 */
export const notesByDate: PaginationIndexConfig<
  NoteIndexValue,
  NoteIndexKey,
  NoteListItem
> = {
  name: "by-date",
  perPage: 4,
  /*
   * Pinned rather than derived from the function source.
   *
   * The automatic spec hash covers `fn.toString()`, which a production build
   * minifies and a dev server does not. An index built by one and read by the
   * other therefore reads as stale and rebuilds itself — every page dirty,
   * every time. The Playwright fixtures are generated against `next dev` and
   * the suite runs against `next start`, so that boundary is crossed on every
   * run; a real deployment crosses it whenever two builds share a content
   * directory. Bump this by hand when `key`, `project` or `filter` changes.
   */
  version: "1",
  key: ({ value, id }) => [value.date, id],
  project: ({ value, id }) => ({
    slug: id,
    title: value.title,
    date: value.date,
  }),
};
