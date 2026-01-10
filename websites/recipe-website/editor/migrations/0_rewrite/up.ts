import { migrateData } from "content-engine/content/migrate";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";

migrateData(recipeContentConfig, async (recipeData) => {
  return recipeData;
});
