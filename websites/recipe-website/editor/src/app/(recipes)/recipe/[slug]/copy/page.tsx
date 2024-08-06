import getRecipeBySlug from "recipe-website-common/controller/data/read";
import CopyForm from "./form";
import { notFound } from "next/navigation";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Recipe({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/recipe/${slug}/copy`,
    });
  }
  let recipe;
  try {
    recipe = await getRecipeBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  return (
    <main className="flex flex-col items-center px-2 grow max-w-prose w-full h-full">
      <h1 className="text-2xl font-bold my-2">Copying recipe</h1>
      <CopyForm recipe={recipe} />
    </main>
  );
}
