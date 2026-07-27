import { rebuildRecipeIndex } from "recipe-editor/controller/actions";
import { rebuildFeaturedRecipeIndex } from "recipe-editor/controller/actions/featuredRecipes";
import { auth, signIn } from "@/auth";
import { readSettings } from "@/settings";
import { SubmitButton } from "@discontent/component-library/components/SubmitButton";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { SettingsForm } from "./SettingsForm";
import { SiteDetailsForm } from "./SiteDetailsForm";

export default async function SettingsPage() {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/settings`,
    });
  }
  const settings = await readSettings();
  return (
    <PageMain>
      <PageSection maxWidth="xl" grow>
        <PageHeading>Site details</PageHeading>
        <div className="mx-2 my-4">
          <SiteDetailsForm settings={settings} />
        </div>
      </PageSection>
      <PageSection maxWidth="xl" grow>
        <PageHeading>Tools</PageHeading>
        <div className="mx-2 my-4">
          <SettingsForm settings={settings} />
        </div>
      </PageSection>
      <PageSection maxWidth="xl" grow>
        <PageHeading>Database</PageHeading>
        <div className="mx-2 my-4">
          <form action={rebuildRecipeIndex}>
            <SubmitButton>Reload Recipe Database</SubmitButton>
          </form>
        </div>
        <div className="mx-2 my-4">
          <form action={rebuildFeaturedRecipeIndex}>
            <SubmitButton>Reload Featured Recipe Database</SubmitButton>
          </form>
        </div>
      </PageSection>
    </PageMain>
  );
}
