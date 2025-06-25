import { getRecipeBySlug } from "recipe-website-common/controller/data/read";
import EditForm from "./form";
import { notFound } from "next/navigation";
import { getTransformedRecipeImageProps } from "recipe-website-common/components/RecipeImage";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Recipe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/recipe/${slug}/edit`,
    });
  }
  let recipe;
  try {
    recipe = await getRecipeBySlug({ slug });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const { name, image } = recipe;
  const defaultImage =
    slug && image
      ? await getTransformedRecipeImageProps({
          slug,
          image,
          alt: "Heading image",
          width: 580,
          height: 450,
          className: "object-cover aspect-ratio-[16/10] h-96",
          sizes: "100vw",
        })
      : undefined;
  return (
    <main className="flex flex-col items-center px-2 grow max-w-prose w-full h-full">
      <h1 className="text-2xl font-bold my-2">Editing Recipe: {name}</h1>
      <EditForm recipe={recipe} slug={slug} defaultImage={defaultImage} />
    </main>
  );
}
