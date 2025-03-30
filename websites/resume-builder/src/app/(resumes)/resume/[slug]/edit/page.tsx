import getResumeBySlug from "@/controller/data/read";
import EditForm from "./EditResumeForm";
import { notFound } from "next/navigation";

export default async function Resume({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let resume;
  try {
    resume = await getResumeBySlug(slug);
  } catch (e) {
    if ((e as { code: string }).code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const { company } = resume;
  return (
    <main className="flex flex-col items-center px-2 grow max-w-prose w-full h-full mx-auto">
      <h1 className="text-2xl font-bold my-2">Editing resume: {company}</h1>
      <EditForm resume={resume} slug={slug} />
    </main>
  );
}
