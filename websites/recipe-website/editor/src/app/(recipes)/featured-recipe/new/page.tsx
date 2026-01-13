import { notFound } from "next/navigation";
import NewFeaturedRecipeForm from "./form";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";
import { auth, signIn } from "@/auth";

export default async function NewFeaturedRecipe({
  searchParams,
}: {
  searchParams: Promise<{ recipe?: string }>;
  params: Promise<{ slug: string }>;
}) {
  const { recipe: preselectedRecipe } = await searchParams;

  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/featured-recipe/new?recipe=${preselectedRecipe}`,
    });
  }

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
