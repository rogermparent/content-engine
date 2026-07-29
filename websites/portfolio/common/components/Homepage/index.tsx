import AboutSection from "./AboutSection";
import ProjectsSection from "./ProjectsSection";
import ContactSection from "./ContactSection";
import { getHomepageContent } from "../../homepage-controller/data";

export async function generateMetadata() {
  const homepageContent = await getHomepageContent();
  const { title } = homepageContent || {};
  return {
    title,
  };
}

export default async function HomePage() {
  const homepageContent = await getHomepageContent();
  const {
    projects,
    contactLinks,
    contactSectionTitle,
    about,
    projectSectionTitle,
  } = homepageContent || {};

  return (
    <div className="flex-1 w-full bg-background text-foreground">
      <AboutSection about={about} />
      <ProjectsSection
        projects={projects}
        projectSectionTitle={projectSectionTitle}
      />
      <ContactSection
        contactSectionTitle={contactSectionTitle}
        contactLinks={contactLinks}
      />
    </div>
  );
}
