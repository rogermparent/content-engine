import { rebuildRecipeIndex } from "recipe-editor/controller/actions";
import { rebuildFeaturedRecipeIndex } from "recipe-editor/controller/actions/featuredRecipes";
import { auth, signIn } from "@/auth";
import { SubmitButton } from "component-library/components/SubmitButton";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

export default async function SettingsPage() {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/settings`,
    });
  }
  return (
    <PageMain>
      <PageSection maxWidth="xl" grow>
        <PageHeading>Database</PageHeading>
        <div className="my-4 mx-2">
          <form action={rebuildRecipeIndex}>
            <SubmitButton>Reload Recipe Database</SubmitButton>
          </form>
        </div>
        <div className="my-4 mx-2">
          <form action={rebuildFeaturedRecipeIndex}>
            <SubmitButton>Reload Featured Recipe Database</SubmitButton>
          </form>
        </div>
      </PageSection>
    </PageMain>
  );
}
