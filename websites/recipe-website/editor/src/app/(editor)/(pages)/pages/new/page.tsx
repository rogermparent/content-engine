import { auth, signIn } from "@/auth";
import NewForm from "./form";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

export default async function NewPage() {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/pages/new`,
    });
  }
  return (
    <PageMain>
      <PageSection maxWidth="xl" grow>
        <PageHeading as="h1">New Page</PageHeading>
        <NewForm />
      </PageSection>
    </PageMain>
  );
}
