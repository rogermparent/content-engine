import { notFound } from "next/navigation";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import EditFeaturedRecipeForm from "./form";

export const dynamic = "force-dynamic";

export default async function EditFeaturedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let featuredRecipe;
  try {
    featuredRecipe = await getFeaturedRecipeBySlug({ slug });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }

  return (
    <main className="flex flex-col items-center w-full p-2 max-w-xl mx-auto grow">
      <EditFeaturedRecipeForm featuredRecipe={featuredRecipe} slug={slug} />
    </main>
  );
}
