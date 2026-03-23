import type {
  Ingredient,
  InstructionEntry,
  Timeline,
} from "recipe-website-common/controller/types";

export type ContentFormState<
  TErrors extends Record<string, string[] | undefined> = Record<
    string,
    string[] | undefined
  >,
  TFormData = Record<string, unknown>,
> = {
  errors?: TErrors;
  message: string;
  slugConflict?: string;
  formData?: TFormData;
};

export interface RecipeFormErrors extends Record<string, string[] | undefined> {
  description?: string[];
  name?: string[];
  date?: string[];
  slug?: string[];
}

export type RecipeFormData = {
  name?: string;
  description?: string;
  slug?: string;
  date?: number;
  ingredients?: Ingredient[];
  instructions?: InstructionEntry[];
  timelines?: Timeline[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  recipeYield?: string;
  videoUrl?: string;
};

export type RecipeFormState = ContentFormState<
  RecipeFormErrors,
  RecipeFormData
>;
