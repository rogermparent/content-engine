import { revalidateAggregateResults } from "@discontent/cms/aggregates/next/revalidate";
import type { ContentWriteResult } from "@discontent/cms/content/types";
import { revalidatePaginationResults } from "@discontent/cms/pagination/next/revalidate";

/**
 * Fire the cache tags one write's regeneration set implies.
 *
 * This demo calls the write functions directly rather than through
 * `createGenericActions`, so it invalidates for itself — this is the same loop
 * `handleContentSuccess` runs, kept in one place for the four call sites.
 *
 * The dependents half is what makes retitling a note update the bookmark
 * pages that show its title: those pages live behind tags keyed by
 * `bookmarks`, not by the content type whose form was submitted.
 *
 * @example
 * ```ts
 * revalidateWrite(noteConfig.contentType, await updateContent({ ... }));
 * ```
 */
export function revalidateWrite(
  contentType: string,
  result: ContentWriteResult,
): void {
  revalidatePaginationResults(contentType, result.pagination);
  revalidateAggregateResults(contentType, result.aggregates);
  for (const dependent of result.dependents) {
    revalidatePaginationResults(dependent.contentType, dependent.pagination);
    revalidateAggregateResults(dependent.contentType, dependent.aggregates);
  }
}

export default revalidateWrite;
