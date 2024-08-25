import Link from "next/link";
import ResumeList from "@/components/Resume/List";
import getResumes from "@/controller/data/readIndex";

export default async function Home() {
  const { resumes, more } = await getResumes({ limit: 3 });
  return (
    <main className="flex flex-col items-center h-full w-full p-2 max-w-prose mx-auto grow bg-slate-950">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl">Latest Resumes</h2>
        {resumes && resumes.length > 0 ? (
          <div>
            <ResumeList resumes={resumes} />
            <div className="flex flex-row items-center justify-center">
              {more && (
                <Link
                  href="/resumes"
                  className="font-semibold text-center p-1 m-1 bg-slate-700 rounded-sm"
                >
                  More
                </Link>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center my-4">There are no resumes yet.</p>
        )}
      </div>
    </main>
  );
}
