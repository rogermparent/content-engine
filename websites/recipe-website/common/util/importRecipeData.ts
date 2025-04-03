import { decodeHTML } from "entities";
import {
  Ingredient,
  Instruction,
  InstructionGroup,
  Recipe,
} from "../controller/types";
import { createIngredient } from "./parseIngredients";

interface RecipeLD {
  name: string;
  description: string;
  recipeIngredient: string[];
  image?: string[];
  recipeInstructions: {
    text?: string;
    itemListElement: { name?: string; text?: string }[];
    name?: string;
  }[];
}

type UnknownLD = Record<string, unknown> | UnknownLD[] | RecipeLD;

export interface ImportedRecipe extends Recipe {
  imageImportUrl?: string;
}

const findRecipeInObject = (jsonLDObject: UnknownLD): RecipeLD | undefined => {
  if (Array.isArray(jsonLDObject)) {
    for (const childObject of jsonLDObject) {
      const foundRecipe = findRecipeInObject(childObject);
      if (foundRecipe) {
        return foundRecipe;
      }
    }
  } else {
    if (jsonLDObject && typeof jsonLDObject === "object") {
      if ("@type" in jsonLDObject) {
        const ldType = jsonLDObject["@type"];
        const isRecipe =
          ldType &&
          (Array.isArray(ldType)
            ? ldType.findIndex((typeString) => typeString === "Recipe") !== -1
            : ldType === "Recipe");
        if (isRecipe) {
          return jsonLDObject as unknown as RecipeLD;
        }
      }
      return findRecipeInObject(Object.values(jsonLDObject) as UnknownLD);
    }
  }
};

function findRecipeObjectInText(text: string): RecipeLD | undefined {
  const jsonLDRegex = /<script.*?ld\+json.*?>([\s\S]*?)<\/script>/gms;

  let jsonLDTextSearch;
  while ((jsonLDTextSearch = jsonLDRegex.exec(text)) !== null) {
    const jsonLDTextMatch = jsonLDTextSearch?.[1];
    if (jsonLDTextMatch) {
      const jsonLDObject: UnknownLD = JSON.parse(jsonLDTextMatch);
      const foundRecipe = findRecipeInObject(jsonLDObject);
      if (foundRecipe) {
        return foundRecipe;
      }
    }
  }
}

function createStep({
  name,
  text = "",
}: {
  name?: string;
  text?: string;
}): Instruction {
  const cleanedName = name
    ? decodeHTML(name).replaceAll(/ +/g, " ")
    : undefined;
  const cleanedText = decodeHTML(text).replaceAll(/ +/g, " ");
  const nameIsNotRedundant =
    cleanedName &&
    cleanedText &&
    !cleanedText.startsWith(cleanedName.replace(/\.\.\.$/, ""));
  return {
    name: nameIsNotRedundant ? cleanedName : undefined,
    text: cleanedText,
  };
}

function getImageUrl(input: string | { url: string }) {
  return typeof input === "string" ? input : input.url;
}

/**
 * Fetches and processes recipe data from a given URL, handling string-based instructions appropriately.
 * @param url - The URL to fetch the recipe data from.
 * @returns A promise resolving to a partial ImportedRecipe object or undefined if no recipe is found.
 */
export async function importRecipeData(
  url: string,
): Promise<Partial<ImportedRecipe> | undefined> {
  const response = await fetch(url); // Removed 'next' option as it’s not standard fetch API
  const text = await response.text();
  const recipeObject = findRecipeObjectInText(text);

  if (!recipeObject) {
    return undefined;
  }

  const { name, description, recipeIngredient, recipeInstructions, image } =
    recipeObject;

  const imageURL =
    image && getImageUrl(Array.isArray(image) ? image[0] : image);

  const newDescriptionSegments = [`*Imported from [${url}](${url})*`];
  if (description) {
    newDescriptionSegments.push(`\n\n---\n\n${description}`);
  }
  const newDescription = newDescriptionSegments.join("");

  const massagedData: Partial<ImportedRecipe> = {
    name,
    imageImportUrl: imageURL,
    description: newDescription,
    ingredients: recipeIngredient
      ?.map(createIngredient)
      .filter(Boolean) as Ingredient[],
    instructions: recipeInstructions?.map((entry) => {
      // Handle string-based instructions
      if (typeof entry === "string") {
        return createStep({ text: entry });
      }
      // Handle instruction groups with itemListElement
      if ("itemListElement" in entry) {
        const { name, itemListElement } = entry;
        return {
          name,
          instructions: itemListElement.map((item) =>
            typeof item === "string"
              ? createStep({ text: item })
              : createStep(item),
          ),
        } as InstructionGroup;
      }
      // Handle standard instruction objects
      return createStep(entry);
    }),
  };

  return massagedData;
}
