import getProjectBySlug from "projects-collection/controller/data/read";
import EditForm from "./form";
import { notFound } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function Project({
  params: { slug: slugSegments },
}: {
  params: { slug: string[] };
}) {
  const slug = slugSegments.join("/");
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/projects/edit/${slug}`,
    });
  }
  let project;
  try {
    project = await getProjectBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
  const { name } = project;
  return (
    <main className="flex flex-col items-center px-2 grow max-w-prose w-full h-full">
      <h1 className="text-2xl font-bold my-2">Editing Project: {name}</h1>
      <EditForm project={project} slug={slug} />
    </main>
  );
}
