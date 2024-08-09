import { Recipe as JsonLDRecipe, WithContext } from "schema-dts";
import { Recipe } from "../../../controller/types";
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

  const recipeInstructions = [];

  if (instructions) {
    for (const instructionEntry of instructions) {
      if ("instructions" in instructionEntry) {
        recipeInstructions.push({
          "@type": "HowToSection",
          name: "To Store",
          itemListElement: instructionEntry.instructions.map(
            ({ text, name }) => ({
              "@type": "HowToStep",
              text: flattenMarkdown(text),
              name,
            }),
          ),
        });
      } else {
        recipeInstructions.push({
          "@type": "HowToStep",
          text: flattenMarkdown(instructionEntry.text),
          name: instructionEntry.name,
        });
      }
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
