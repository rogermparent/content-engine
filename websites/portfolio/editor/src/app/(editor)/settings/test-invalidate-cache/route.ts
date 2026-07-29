import { revalidatePath } from "next/cache";

/**
 * Test-only cache invalidation, and the fingerprint global-setup uses to prove
 * the server on the test port really is this app.
 *
 * Unauthenticated *by design* — the Playwright fixtures mutate content on disk
 * behind Next's back and must be able to flush the cache before a request is
 * signed in. `TEST_MODE` is the gate: outside it this 404s.
 */
export async function GET() {
  if (!process.env.TEST_MODE) {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  revalidatePath("/", "layout");
  return Response.json({ revalidated: true }, { status: 200 });
}
