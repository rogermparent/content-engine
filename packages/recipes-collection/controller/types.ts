export type Ingredient = {
  ingredient: string;
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

export interface Recipe {
  name: string;
  date: number;
  description?: string;
  image?: string;
  video?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  servingSize?: string;
  ingredients?: Ingredient[];
  instructions?: InstructionEntry[];
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
