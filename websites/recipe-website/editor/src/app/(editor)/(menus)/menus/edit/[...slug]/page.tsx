import getMenuBySlug from "menus-collection/controller/data/read";
import EditForm from "./form";
import deleteMenu from "menus-collection/controller/actions/delete";
import { SubmitButton } from "component-library/components/SubmitButton";
import { auth, signIn } from "@/auth";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

async function maybeGetMenu(slug: string) {
  try {
    const menu = await getMenuBySlug(slug);
    return menu;
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return undefined;
    }
    throw e;
  }
}

export default async function Menu({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const user = await auth();
  const { slug: slugSegments } = await params;
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/menus/edit/${slugSegments.join("/")}`,
    });
  }
  const slug = slugSegments.join("/");
  const deleteThisMenu = deleteMenu.bind(null, slug);
  const menu = await maybeGetMenu(slug);

  return (
    <PageMain>
      <PageSection maxWidth="xl" grow>
        <PageHeading as="h1">Editing Menu: {slug}</PageHeading>
        <EditForm menu={menu} slug={slug} />
        <form action={deleteThisMenu}>
          <SubmitButton>Delete</SubmitButton>
        </form>
      </PageSection>
    </PageMain>
  );
}
