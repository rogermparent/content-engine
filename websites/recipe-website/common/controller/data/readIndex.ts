import getRecipeDatabase from "../database";

export interface MassagedRecipeEntry {
  date: number;
  slug: string;
  name: string;
  ingredients?: string[];
  image?: string;
}

export interface ReadRecipeIndexResult {
  recipes: MassagedRecipeEntry[];
  more: boolean;
}

export default async function getRecipes({
  limit,
  offset,
}: { limit?: number; offset?: number } = {}): Promise<ReadRecipeIndexResult> {
  const db = getRecipeDatabase();
  const recipes = db
    .getRange({ limit, offset, reverse: true })
    .map(({ key: [date, slug], value: { name, ingredients, image } }) => ({
      date,
      slug,
      name,
      ingredients,
      image,
    })).asArray;
  const totalRecipes = db.getCount();
  const more = (offset || 0) + (limit || 0) < totalRecipes;
  db.close();
  return { recipes, more };
}
