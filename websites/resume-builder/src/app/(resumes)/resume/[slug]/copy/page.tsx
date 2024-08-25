import getResumeBySlug from "@/app/lib/models/resumes/data/read";
import CopyForm from "./form";
import { notFound } from "next/navigation";

export default async function Resume({
  params: { slug },
}: {
  params: { slug: string };
}) {
  let resume;
  try {
    resume = await getResumeBySlug(slug);
  } catch (e) {
    if ((e as { code: string }).code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  return (
    <main className="flex flex-col items-center px-2 grow max-w-prose w-full h-full">
      <h1 className="text-2xl font-bold my-2">Copying resume</h1>
      <CopyForm resume={resume} />
    </main>
  );
}
