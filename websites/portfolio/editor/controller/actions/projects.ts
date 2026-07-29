"use server";

import { createGenericActions } from "@discontent/cms/content/genericActions";
import type { EditorContentConfig } from "@discontent/cms/content/editorContentConfig";
import type { UploadSpec } from "@discontent/cms/content/types";
import createDefaultSlug from "@discontent/projects-collection/controller/createSlug";
import { projectContentConfig } from "@discontent/projects-collection/controller/projectContentConfig";
import parseProjectFormData, {
  type ParsedProjectFormData,
} from "@discontent/projects-collection/controller/parseFormData";
import type {
  ProjectFormData,
  ProjectFormState,
} from "@discontent/projects-collection/controller/formState";
import type {
  Project,
  ProjectEntryKey,
} from "@discontent/projects-collection/controller/types";
import { getProjectBySlug } from "@discontent/projects-collection/controller/data/read";
import slugify from "@sindresorhus/slugify";
import { z } from "zod";
import { authenticateUser } from "./shared";

/*
 * Projects' write path.
 *
 * What this replaces is the point of the change. The three previous actions in
 * @discontent/projects-collection were "use server" functions with **no auth
 * check at all** — a server action is a POST endpoint, so anyone who could reach
 * the app could create, overwrite or recursively delete any project. They also
 * wrote with a bare outputJson/rename/rm, so there was no git commit, no LMDB
 * index, no uploads, and no slug-conflict handling.
 *
 * Everything here now rides createGenericActions, which is the same factory
 * recipe uses, behind a required `authenticate`.
 */

function formDataFromParsed(parsed: ParsedProjectFormData): ProjectFormData {
  return {
    name: parsed.name,
    summary: parsed.summary,
    content: parsed.content,
    slug: parsed.slug,
    date: parsed.date || undefined,
    role: parsed.role,
    client: parsed.client,
    status: parsed.status,
    featured: parsed.featured,
    tags: parsed.tags,
    links: parsed.links,
  };
}

function buildProjectData(
  parsed: ParsedProjectFormData,
  date: number,
): { data: Project; uploads: Record<string, UploadSpec> } {
  const {
    name,
    summary,
    content,
    role,
    client,
    status,
    featured,
    tags,
    links,
  } = parsed;
  return {
    data: {
      name,
      date,
      summary: summary || undefined,
      content: content ?? "",
      role: role || undefined,
      client: client || undefined,
      status: status || undefined,
      featured: featured || undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
      links: links && links.length > 0 ? links : undefined,
    },
    uploads: {},
  };
}

const projectEditorConfig: EditorContentConfig<
  Project,
  ReturnType<typeof projectContentConfig.buildIndexValue>,
  ProjectEntryKey,
  ProjectFormState,
  ParsedProjectFormData
> = {
  contentConfig: projectContentConfig,
  successConfig: {
    // Deliberately "/project/<slug>", not "/<slug>". create.ts and update.ts
    // used to redirect to "/" + slug, which lands on the *pages* catch-all —
    // which is why creating a project appeared to be broken.
    itemBasePath: "/project",
    listPaths: [{ path: "/projects" }, { path: "/", type: "page" }],
  },

  parseFormData: (formData: FormData) => {
    const validated = parseProjectFormData(formData);
    if (!validated.success) {
      return {
        success: false as const,
        state: {
          errors: z.flattenError(validated.error).fieldErrors,
          message: "Failed to save project.",
        } as ProjectFormState,
      };
    }
    return { success: true as const, parsed: validated.data };
  },

  buildCreateData: async (parsed) => {
    const date = parsed.date || Date.now();
    const slug = slugify(parsed.slug || createDefaultSlug(parsed));
    return { slug, data: buildProjectData(parsed, date).data };
  },

  buildUpdateData: async (parsed, _currentSlug, currentDate) => {
    const date = parsed.date || currentDate || Date.now();
    const slug = slugify(parsed.slug || createDefaultSlug(parsed));
    return { slug, data: buildProjectData(parsed, date).data };
  },

  buildCurrentIndexKey: (currentDate, currentSlug): ProjectEntryKey => [
    currentDate,
    currentSlug,
  ],

  checkSlugConflict: async (slug, contentDirectory) => {
    try {
      await getProjectBySlug(slug, contentDirectory);
      return true;
    } catch {
      return false;
    }
  },

  extractFormData: formDataFromParsed,

  label: "project",
  authenticate: authenticateUser,
};

const projectActions = createGenericActions(projectEditorConfig);

export async function createProject(
  prevState: ProjectFormState | null,
  formData: FormData,
): Promise<ProjectFormState> {
  return projectActions.create(prevState, formData);
}

export async function updateProject(
  currentDate: number,
  currentSlug: string,
  prevState: ProjectFormState | null,
  formData: FormData,
): Promise<ProjectFormState> {
  return projectActions.update(currentDate, currentSlug, prevState, formData);
}

export async function deleteProject(date: number, slug: string): Promise<void> {
  return projectActions.delete(date, slug);
}
