import { notFound } from "next/navigation";
import { getProjectBySlug } from "@discontent/projects-collection/controller/data/read";
import getProjects from "@discontent/projects-collection/controller/data/readIndex";
import { ProjectView } from "@discontent/projects-collection/components/View";

/**
 * A work's case study, statically rendered.
 *
 * The ENOENT→notFound() guard is duplicated into generateMetadata on purpose:
 * Next runs the two independently, so a guard in only the page leaves metadata
 * throwing — turning what should be a 404 into a build-time crash.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const project = await getProjectBySlug(slug);
    return { title: project.name, description: project.summary };
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let project;
  try {
    project = await getProjectBySlug(slug);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }

  return (
    <main className="mx-auto w-full max-w-3xl grow px-4 py-12 sm:px-6 sm:py-16">
      <ProjectView project={project} />
    </main>
  );
}

export async function generateStaticParams() {
  // Reads the LMDB index, which must therefore exist at build time — the export
  // action rebuilds it before invoking the build for exactly this reason.
  const { projects } = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}
