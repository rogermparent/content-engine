export type Ingredient = {
  ingredient: string;
  type?: "heading";
};

export interface Instruction {
  name?: string;
  text: string;
}

export interface InstructionHeading {
  name: string;
  level?: number;
}

export type InstructionEntry = Instruction | InstructionHeading;

export interface TimelineEvent {
  name?: string;
  activeTime: boolean;
  defaultLength: number;
  minLength?: number;
  maxLength?: number;
}

export interface Timeline {
  name?: string;
  events: TimelineEvent[];
  default_offset?: number;
  note?: string;
}

export interface Recipe {
  name: string;
  date: number;
  description?: string;
  image?: string;
  video?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  recipeYield?: string;
  ingredients?: Ingredient[];
  instructions?: InstructionEntry[];
  timelines?: Timeline[];
  [key: string]: unknown;
}

export type RecipeEntryKey = [date: number, slug: string];
export interface RecipeEntryValue {
  name: string;
  description?: string;
  image?: string;
  ingredients?: string[];
}

export interface RecipeEntry {
  key: RecipeEntryKey;
  value: RecipeEntryValue;
  version?: number;
}

export interface FeaturedRecipe {
  recipe: string; // Recipe slug/id reference
  date: number;
  note?: string;
  [key: string]: unknown;
}

export type FeaturedRecipeEntryKey = [date: number, slug: string];
export interface FeaturedRecipeEntryValue {
  recipe: string;
  note?: string;
}

export interface FeaturedRecipeEntry {
  key: FeaturedRecipeEntryKey;
  value: FeaturedRecipeEntryValue;
  version?: number;
}
