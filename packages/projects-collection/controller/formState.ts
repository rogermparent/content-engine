import type { ContentFormState } from "@discontent/cms/forms/formState";
import type { ProjectLink } from "./types";

export interface ProjectFormErrors extends Record<
  string,
  string[] | undefined
> {
  name?: string[];
  summary?: string[];
  content?: string[];
  date?: string[];
  slug?: string[];
  role?: string[];
  client?: string[];
  status?: string[];
  links?: string[];
}

/**
 * Values echoed back on a failed round-trip. The form shell remounts keyed on
 * the message so a user's typing survives a server-side validation error —
 * `useForm` captures its defaults at mount, so without both halves of that the
 * input is silently discarded.
 */
export type ProjectFormData = {
  name?: string;
  summary?: string;
  content?: string;
  slug?: string;
  date?: number;
  role?: string;
  client?: string;
  status?: "shipped" | "wip" | "archived";
  featured?: boolean;
  tags?: string[];
  links?: ProjectLink[];
};

export type ProjectFormState = ContentFormState<
  ProjectFormErrors,
  ProjectFormData
>;
