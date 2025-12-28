export interface FeaturedRecipeFormErrors extends Record<
  string,
  string[] | undefined
> {
  recipe?: string[];
  date?: string[];
  note?: string[];
  slug?: string[];
}

export type FeaturedRecipeFormState = {
  errors?: FeaturedRecipeFormErrors;
  message: string;
};
