import { notFound } from "next/navigation";
import { getFeaturedRecipeBySlug } from "recipe-website-common/controller/data/readFeaturedRecipes";
import EditFeaturedRecipeForm from "./form";
import {
  PageMain,
  PageSection,
} from "recipe-website-common/components/PageLayout";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function EditFeaturedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/featured-recipe/${slug}/edit`,
    });
  }
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
    <PageMain>
      <PageSection maxWidth="xl" grow>
        <EditFeaturedRecipeForm featuredRecipe={featuredRecipe} slug={slug} />
      </PageSection>
    </PageMain>
  );
}
