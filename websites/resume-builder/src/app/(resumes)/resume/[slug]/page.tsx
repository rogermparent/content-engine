import Link from "next/link";
import { notFound } from "next/navigation";
import { ResumeView } from "@/components/Resume/View";
import getResumeBySlug from "@/controller/data/read";
import deleteResume from "@/controller/actions/delete";

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}) {
  return { title: slug };
}

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
  const { date } = resume;

  const deleteResumeWithId = deleteResume.bind(null, date, slug);

  return (
    <main className="flex flex-col items-center w-full h-full grow">
      <ResumeView resume={resume} />
      <hr className="w-full border-slate-700 print:hidden" />
      <div className="flex flex-row justify-center m-1 print:hidden">
        <form action={deleteResumeWithId}>
          <button className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1">
            Delete
          </button>
        </form>
        <Link
          href={`/resume/${slug}/edit`}
          className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1"
        >
          Edit
        </Link>
        <Link
          href={`/resume/${slug}/copy`}
          className="underline bg-slate-700 rounded-md text-sm py-1 px-2 mx-1"
        >
          Copy
        </Link>
      </div>
    </main>
  );
}
