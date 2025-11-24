import { notFound } from "next/navigation";
import NewFeaturedRecipeForm from "./form";

export default async function NewFeaturedRecipe({
  searchParams,
}: {
  searchParams: Promise<{ recipe?: string }>;
}) {
  const params = await searchParams;
  const preselectedRecipe = params.recipe;

  if (!preselectedRecipe) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center w-full p-2 max-w-prose mx-auto grow">
      <NewFeaturedRecipeForm preselectedRecipe={preselectedRecipe} />
    </main>
  );
}
