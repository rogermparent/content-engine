export type Ingredient = {
  ingredient: string;
  type?: "heading";
};

export interface Instruction {
  name?: string;
  text: string;
}

export interface InstructionGroup {
  name: string;
  instructions: Instruction[];
}

export type InstructionEntry = Instruction | InstructionGroup;

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
  tags?: string[];
  [key: string]: unknown;
}

export type RecipeEntryKey = [date: number, slug: string];
export interface RecipeEntryValue {
  name: string;
  description?: string;
  image?: string;
  ingredients?: string[];
  tags?: string[];
  /**
   * Durations in minutes, carried on the index so the search query language's
   * `time:` filter can evaluate client-side. Stored, never tokenized — they
   * feed a numeric comparison, not the text index.
   */
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
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
  /**
   * Borrowed from the referenced recipe (§6.1). Optional for two independent
   * reasons: the reference can dangle, since a recipe can be deleted while
   * features of it remain, and an index built before these fields existed
   * simply will not have them.
   *
   * Carrying them is what makes the featured-recipes index covering, so a card
   * renders without the per-entry `recipe.json` read `getFeaturedRecipes` used
   * to do. `recipeImage` is a bare filename, the same as `Recipe["image"]` —
   * the card pairs it with the recipe slug itself.
   */
  recipeName?: string;
  recipeImage?: string;
}

export interface FeaturedRecipeEntry {
  key: FeaturedRecipeEntryKey;
  value: FeaturedRecipeEntryValue;
  version?: number;
}
