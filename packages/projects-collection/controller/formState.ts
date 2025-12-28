export interface ProjectFormErrors extends Record<
  string,
  string[] | undefined
> {
  name?: string[];
  date?: string[];
  slug?: string[];
}

export type ProjectFormState = {
  errors?: ProjectFormErrors;
  message: string;
};
