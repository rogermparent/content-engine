import { migrateData } from "@discontent/cms/content/migrate";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";

migrateData(recipeContentConfig, async (recipeData) => {
  return recipeData;
});
