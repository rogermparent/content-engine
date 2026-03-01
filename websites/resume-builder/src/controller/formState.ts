export interface ResumeFormErrors extends Record<string, string[] | undefined> {
  company?: string[];
  job?: string[];
  date?: string[];
  slug?: string[];
  skills?: string[];
  name?: string[];
  phone?: string[];
  email?: string[];
  address?: string[];
  github?: string[];
  linkedin?: string[];
  website?: string[];
  education?: string[];
  experience?: string[];
  projects?: string[];
}

export type ResumeFormState = {
  errors: ResumeFormErrors;
  message: string;
};
