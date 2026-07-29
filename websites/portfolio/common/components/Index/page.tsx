import type { Metadata } from "next";
import getProjects from "@discontent/projects-collection/controller/data/readIndex";
import { getSiteConfig, getSitePosture } from "../../config/site";
import { IndexSearchProvider } from "./SearchContext";
import { PostureShell } from "./PostureShell";

/**
 * The homepage.
 *
 * There is no hero band above the index, no stat tiles and no gradient — the
 * thesis is that a portfolio's most characteristic artifact is the list of what
 * you made, so the homepage *is* that list.
 *
 * Which shape that list takes is the *posture*, read from SITE_LAYOUT and baked
 * into the export. Same components, same data, same search — different order and
 * weight, so one template serves a developer, a designer and a job-seeker.
 *
 * The full array is read here, on the server, and handed to the provider as a
 * prop rather than fetched. That is what makes search work before hydration and
 * degrade to a complete, readable list with JavaScript disabled.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = getSiteConfig();
  return { title, description };
}

export async function IndexPage() {
  const { projects } = await getProjects();
  const { statement } = getSiteConfig();
  const posture = getSitePosture();

  return (
    <IndexSearchProvider projects={projects}>
      <PostureShell posture={posture} statement={statement} />
    </IndexSearchProvider>
  );
}

export default IndexPage;
