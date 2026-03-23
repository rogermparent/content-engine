import Link from "next/link";
import { notFound } from "next/navigation";
import getPageBySlug from "@discontent/pages-collection/controller/data/read";
import deletePage from "@discontent/pages-collection/controller/actions/delete";
import RenderedPage from "recipe-website-common/components/RenderedPage";

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
          <form action={deletePageWithId}>
            <button className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1">
              Delete
            </button>
          </form>
          <Link
            href={`/pages/edit/${slug}`}
            className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1"
          >
            Edit
          </Link>
        </>
      }
    />
  );
}
