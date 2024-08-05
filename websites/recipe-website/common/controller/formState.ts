export interface RecipeFormErrors extends Record<string, string[] | undefined> {
  description?: string[];
  name?: string[];
  date?: string[];
  slug?: string[];
}

export type RecipeFormState = {
  errors?: RecipeFormErrors;
  message: string;
};
