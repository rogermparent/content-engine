import { revalidatePath } from "next/cache";

export async function GET() {
  // Only allow in test environment
  if (!process.env.TEST_MODE) {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  revalidatePath("/", "layout");
  return Response.json({ revalidated: true }, { status: 200 });
}
