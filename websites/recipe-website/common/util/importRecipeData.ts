import {
  Ingredient,
  Instruction,
  InstructionEntry,
  InstructionHeading,
  Recipe,
} from "../controller/types";
import { createIngredient } from "./parseIngredients";
import { fromHtml } from "hast-util-from-html";
import { toMdast } from "hast-util-to-mdast";
import { toMarkdown } from "mdast-util-to-markdown";

import { decodeHTML } from "entities";

function decodeText(html: string) {
  const hast = fromHtml(decodeHTML(html), { fragment: true });
  const mdast = toMdast(hast);
  const markdown = toMarkdown(mdast);
  return markdown.trim();
}

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
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
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
    ? decodeText(name).replaceAll(/ +/g, " ")
    : undefined;
  const cleanedText = decodeText(text).replaceAll(/ +/g, " ");
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

// Function to parse ISO 8601 duration strings to minutes
const parseDurationToMinutes = (
  duration: string | undefined,
): number | undefined => {
  if (!duration) return undefined;
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!matches) return undefined;
  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  return hours * 60 + minutes;
};

export async function importRecipeData(
  rawUrl: string,
): Promise<Partial<ImportedRecipe> | undefined> {
  // Trim hash from URL if it exists
  const url = rawUrl?.split("#")[0];
  const response = await fetch(url, { next: { revalidate: 300 } });

  const text = await response.text();
  const recipeObject = findRecipeObjectInText(text);

  // Return undefined early if no recipe is found
  if (!recipeObject) {
    return undefined;
  }

  const {
    name,
    description,
    recipeIngredient,
    recipeInstructions,
    image,
    prepTime,
    cookTime,
    totalTime,
  } = recipeObject;

  const imageURL =
    image && getImageUrl(Array.isArray(image) ? image[0] : image);

  const newDescriptionSegments = [`*Imported from [${url}](${url})*`];
  if (description) {
    newDescriptionSegments.push(`\n\n---\n\n${decodeText(description)}`);
  }
  const newDescription = newDescriptionSegments.join("");

  const massagedData: Partial<ImportedRecipe> = {
    name: decodeText(name),
    imageImportUrl: imageURL,
    description: newDescription,
    prepTime: parseDurationToMinutes(prepTime),
    cookTime: parseDurationToMinutes(cookTime),
    totalTime: parseDurationToMinutes(totalTime),
    ingredients: recipeIngredient
      ?.map((ingredientLine) => createIngredient(decodeText(ingredientLine)))
      .filter(Boolean) as Ingredient[],
    instructions: recipeInstructions?.reduce<InstructionEntry[]>(
      (acc, entry) => {
        // Handle string-based instructions
        if (typeof entry === "string") {
          return acc.concat(createStep({ text: entry }));
        }

        // Handle instruction groups with itemListElement
        if ("itemListElement" in entry) {
          const { name, itemListElement } = entry;
          return acc.concat(
            {
              type: "heading",
              name: name && decodeText(name),
            } as InstructionHeading,
            ...itemListElement.map<Instruction>((item) =>
              typeof item === "string"
                ? createStep({ text: item }) // Handle nested string-based instructions
                : createStep(item),
            ),
          );
        }

        // Handle standard entries
        return acc.concat(createStep(entry));
      },
      [],
    ),
  };

  return massagedData;
}
