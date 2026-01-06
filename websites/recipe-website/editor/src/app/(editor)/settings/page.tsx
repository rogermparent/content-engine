import { rebuildRecipeIndex } from "recipe-editor/controller/actions";
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
        <div className="p-2">
          <form action={rebuildRecipeIndex}>
            <SubmitButton>Reload Database</SubmitButton>
          </form>
        </div>
      </PageSection>
    </PageMain>
  );
}
