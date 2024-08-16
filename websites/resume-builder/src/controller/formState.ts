export interface ResumeFormErrors extends Record<string, string[] | undefined> {
  description?: string[];
  name?: string[];
  date?: string[];
  slug?: string[];
}

export type ResumeFormState = {
  errors?: ResumeFormErrors;
  message: string;
};
