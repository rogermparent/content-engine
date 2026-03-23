import { pagesBaseDirectory } from "../filesystemDirectories";
import getPageBySlug from "./read";
import { collectFiles } from "@discontent/cms/fs/collectFiles";

export interface MassagedPageEntry {
  date: number;
  slug: string;
  name: string;
  content: string;
}

export interface ReadPageIndexResult {
  pages: MassagedPageEntry[];
}

async function getMassagedPage(slug: string): Promise<MassagedPageEntry> {
  const pageData = await getPageBySlug(slug);
  return { ...pageData, slug };
}

export default async function getPages(): Promise<ReadPageIndexResult> {
  const pagePromises = await collectFiles(
    pagesBaseDirectory,
    "page.json",
    getMassagedPage,
  );
  const pages = await Promise.all(pagePromises);
  return { pages };
}
