import { projectsBaseDirectory } from "../filesystemDirectories";
import getProjectBySlug from "./read";
import { collectFiles } from "@discontent/cms/fs/collectFiles";

export interface MassagedProjectEntry {
  date: number;
  slug: string;
  name: string;
  content: string;
}

export interface ReadProjectIndexResult {
  projects: MassagedProjectEntry[];
}

async function getMassagedProject(slug: string): Promise<MassagedProjectEntry> {
  const projectData = await getProjectBySlug(slug);
  return { ...projectData, slug };
}

export default async function getProjects(): Promise<ReadProjectIndexResult> {
  const projectPromises = await collectFiles(
    projectsBaseDirectory,
    "project.json",
    getMassagedProject,
  );
  const projects = await Promise.all(projectPromises);
  return { projects };
}
