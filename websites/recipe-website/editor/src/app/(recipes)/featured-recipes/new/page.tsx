import { notFound } from "next/navigation";
import NewFeaturedRecipeForm from "./form";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";

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
    <PageMain>
      <PageSection maxWidth="xl" grow>
        <NewFeaturedRecipeForm preselectedRecipe={preselectedRecipe} />
      </PageSection>
    </PageMain>
  );
}
