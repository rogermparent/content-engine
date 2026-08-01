import { revalidateTag } from "next/cache";
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
  revalidateTag(notePages.tags.all, { expire: 0 });
  return Response.json({ ok: true });
}
