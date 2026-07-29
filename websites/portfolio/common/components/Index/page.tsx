import type { Metadata } from "next";
import getProjects from "@discontent/projects-collection/controller/data/readIndex";
import { getSiteConfig } from "../../config/site";
import { IndexSearchProvider } from "./SearchContext";
import { ProjectIndex } from "./index";

/**
 * The homepage.
 *
 * There is no hero band above the index, no stat tiles and no gradient — the
 * thesis is that a portfolio's most characteristic artifact is the list of what
 * you made, so the homepage *is* that list. A short statement, a count line,
 * then the works.
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

  return (
    <IndexSearchProvider projects={projects}>
      <ProjectIndex statement={statement} />
    </IndexSearchProvider>
  );
}

export default IndexPage;
