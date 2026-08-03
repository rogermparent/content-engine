import type { PaginationIndexConfig } from "@discontent/cms/pagination/types";
import type { BookmarkIndexKey, BookmarkIndexValue } from "./bookmarks";

/**
 * What one row of a paginated bookmark list renders.
 *
 * `noteTitle` is borrowed from the referenced note. Nothing in this module
 * reads a note — the value is already in the bookmark's content index value by
 * the time pagination sees it, which is the whole point of §6.1: `project`
 * stays synchronous and phase 2 stays a walk over materialized values.
 */
export interface BookmarkListItem {
  slug: string;
  label: string;
  date: number;
  noteTitle?: string;
}

/**
 * Bookmarks by date, newest first.
 *
 * `noteTitle` is in the projection deliberately. Only the projection is hashed
 * (§3.5), so a borrowed field that is not projected could never dirty a page —
 * and the payoff assertion, that retitling a note dirties exactly the bookmark
 * pages showing it, would be unobservable.
 */
export const bookmarksByDate: PaginationIndexConfig<
  BookmarkIndexValue,
  BookmarkIndexKey,
  BookmarkListItem
> = {
  name: "by-date",
  perPage: 4,
  /*
   * Pinned by hand, for the reason `notePagination.ts` records: the automatic
   * spec hash covers `fn.toString()`, which a production build minifies and a
   * dev server does not. Fixtures are generated against `next dev` and the
   * suite runs against `next start`, so that boundary is crossed every run.
   * Bump this when `key`, `project` or `filter` changes (F16).
   */
  version: "1",
  key: ({ value, id }) => [value.date, id],
  project: ({ value, id }) => ({
    slug: id,
    label: value.label,
    date: value.date,
    noteTitle: value.noteTitle,
  }),
};
