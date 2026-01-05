import { notFound } from "next/navigation";
import getPageBySlug from "pages-collection/controller/data/read";
import getPages from "pages-collection/controller/data/readIndex";
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
  if (!slug || slug === "/") {
    return null;
  }
  let page;
  try {
    page = await getPageBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }

  return <RenderedPage page={page} />;
}

export async function generateStaticParams() {
  const { pages } = await getPages();
  if (!pages?.length) {
    return [{ slug: ["/"] }];
  }
  return pages.map(({ slug }) => ({ slug: slug.split("/") }));
}
