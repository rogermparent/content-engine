import { HomepageContent } from "../../../homepage-controller/types";
import ProjectCard from "../ProjectCard";

export default function ProjectsSection({
  projects,
  projectSectionTitle,
}: HomepageContent) {
  return (
    <section className="w-full" id="projects">
      <div className="container max-w-screen-lg mx-auto px-4 my-12">
        {projectSectionTitle && (
          <h2 className="text-2xl md:text-3xl font-bold px-2 my-10 text-center text-foreground font-display">
            {projectSectionTitle}
          </h2>
        )}
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects
            ? projects.map(async (project, i) => {
                return <ProjectCard key={i} project={project} />;
              })
            : null}
        </ul>
      </div>
    </section>
  );
}
