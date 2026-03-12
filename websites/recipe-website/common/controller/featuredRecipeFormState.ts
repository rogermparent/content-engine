import type { ContentFormState } from "recipe-website-common/controller/formState";

export interface FeaturedRecipeFormErrors extends Record<
  string,
  string[] | undefined
> {
  recipe?: string[];
  date?: string[];
  note?: string[];
  slug?: string[];
}

export type FeaturedRecipeFormState = ContentFormState<FeaturedRecipeFormErrors>;
