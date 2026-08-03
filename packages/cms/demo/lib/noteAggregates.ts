import type { AggregateConfig } from "@discontent/cms/aggregates/types";
import type { NoteIndexKey, NoteIndexValue } from "./notes";

/**
 * The unique tag set across every note, sorted.
 *
 * Its own module rather than a field inside `notes.ts`, for the same reason
 * `notePagination.ts` is: the content config imports this, and this imports
 * only *types* back, so there is no cycle.
 *
 * The proving ground for the aggregate kind — a value that depends on the whole
 * corpus and is unchanged by almost every write to it. Adding a note with an
 * existing tag reports `changed: false` and fires no tag; adding one with a new
 * tag fires it exactly once.
 */
export const noteTags: AggregateConfig<
  NoteIndexValue,
  NoteIndexKey,
  Set<string>,
  string[]
> = {
  name: "tags",
  /*
   * Pinned rather than derived from the function source, for the reason
   * `notesByDate.version` spells out: the automatic spec hash covers
   * `fn.toString()`, which a production build minifies and a dev server does
   * not, so an aggregate folded by one and read by the other would recompute
   * on every pass. Bump by hand when the fold changes.
   */
  version: "1",
  /*
   * A `Set` accumulator, a sorted array as the value. The accumulator is where
   * deduping is cheap; the value has to be JSON-serializable and stably
   * ordered, since it is what gets hashed and a different order would read as
   * a change.
   */
  initial: () => new Set<string>(),
  fold: (tags, { value }) => {
    for (const tag of value.tags ?? []) tags.add(tag);
    return tags;
  },
  finalize: (tags) => [...tags].sort(),
};

export default noteTags;
