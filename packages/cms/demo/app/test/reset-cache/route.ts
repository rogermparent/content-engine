import { revalidateTag } from "next/cache";
import { bookmarkPages } from "@/lib/bookmarkPaginationReads";
import { noteTagReads } from "@/lib/noteAggregateReads";
import { notePages } from "@/lib/notePaginationReads";

export const dynamic = "force-dynamic";

/**
 * Drop every cached pagination read. For the Playwright harness only.
 *
 * `resetData` rolls the content directory back to a fixture, which is not a
 * write and therefore fires no cache tags — nothing in the running server can
 * know the corpus went backwards. Without this, a page cached during one test
 * would be served to the next one, and the suite's results would depend on the
 * order it ran in.
 *
 * `revalidateTag` rather than `updateTag`: the latter throws outside a Server
 * Action. The `{ expire: 0 }` profile is what makes it immediate instead of
 * stale-while-revalidate.
 */
export async function POST() {
  /*
   * Every paginated type, not just notes. Missing one makes the suite
   * run-order dependent again, and the failure looks like a flake rather than
   * a missing line here.
   */
  revalidateTag(notePages.tags.all, { expire: 0 });
  revalidateTag(bookmarkPages.tags.all, { expire: 0 });
  /*
   * And every aggregate. An aggregate has one tag rather than a catch-all plus
   * specifics, so there is nothing to fold — but it is a *separate* tag from
   * the pagination ones, so a rollback that expired only those would serve a
   * tag cloud folded from the previous fixture.
   */
  revalidateTag(noteTagReads.tags.value, { expire: 0 });
  return Response.json({ ok: true });
}
