import Link from "next/link";
import { notFound } from "next/navigation";
import getPageBySlug from "@discontent/pages-collection/controller/data/read";
import deletePage from "@discontent/pages-collection/controller/actions/delete";
import RenderedPage from "recipe-website-common/components/RenderedPage";
import { Button } from "@discontent/component-library/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugSegments } = await params;
  const slug = slugSegments.join("/");
  return { title: slug };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugSegments } = await params;
  const slug = slugSegments.join("/");
  let page;
  try {
    page = await getPageBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const deletePageWithId = deletePage.bind(null, slug);

  return (
    <RenderedPage
      page={page}
      actions={
        <>
          <form action={deletePageWithId} className="contents">
            <Button type="submit" size="sm" variant="destructive">
              Delete
            </Button>
          </form>
          <Button asChild size="sm">
            <Link href={`/pages/edit/${slug}`}>Edit</Link>
          </Button>
        </>
      }
    />
  );
}
