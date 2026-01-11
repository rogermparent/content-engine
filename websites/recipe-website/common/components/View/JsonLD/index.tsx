import {
  HowToSection,
  HowToStep,
  Recipe as JsonLDRecipe,
  WithContext,
} from "schema-dts";
import { Instruction, Recipe } from "../../../controller/types";
import { flattenMarkdown } from "recipe-website-common/controller/buildIndexValue";
import { getWebsiteRoot } from "content-engine/util/getWebsiteRoot";

function buildJsonLDIngredients(
  recipe: Recipe,
): JsonLDRecipe["recipeIngredient"] {
  const { ingredients } = recipe;

  const recipeIngredient = [];

  if (ingredients) {
    for (const ingredient of ingredients) {
      if (!ingredient.type) {
        recipeIngredient.push(flattenMarkdown(ingredient.ingredient));
      }
    }
  }

  return recipeIngredient as JsonLDRecipe["recipeIngredient"];
}

export function buildJsonLDInstructions(
  recipe: Recipe,
): JsonLDRecipe["recipeInstructions"] {
  const { instructions } = recipe;

  const recipeInstructions: (HowToStep | HowToSection)[] = [];
  let currentSection: HowToSection | undefined = undefined;

  if (instructions) {
    for (const instructionEntry of instructions) {
      if ("type" in instructionEntry && instructionEntry.type === "heading") {
        if (currentSection) {
          recipeInstructions.push(currentSection);
        }
        currentSection = {
          "@type": "HowToSection",
          name: instructionEntry.name,
          itemListElement: [],
        };
      } else {
        const { text, name } = instructionEntry as Instruction;
        (
          (currentSection?.itemListElement as HowToStep[]) || recipeInstructions
        ).push({
          "@type": "HowToStep",
          text: flattenMarkdown(text),
          name,
        });
      }
    }
    if (currentSection) {
      recipeInstructions.push(currentSection);
    }
  }

  return recipeInstructions as JsonLDRecipe["recipeInstructions"];
}

export function buildRecipeJsonLD(
  recipe: Recipe,
  image: string | undefined,
): JsonLDRecipe {
  const { name } = recipe;

  const jsonLD: WithContext<JsonLDRecipe> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    image: getWebsiteRoot() + image,
    name,
    recipeIngredient: buildJsonLDIngredients(recipe),
    recipeInstructions: buildJsonLDInstructions(recipe),
  };

  return jsonLD;
}

export function RecipeJsonLD({
  recipe,
  image,
}: {
  recipe: Recipe;
  image?: string;
}) {
  const recipeJsonLD = buildRecipeJsonLD(recipe, image);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLD) }}
    />
  );
}
