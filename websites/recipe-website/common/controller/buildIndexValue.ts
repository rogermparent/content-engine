import { Recipe, RecipeEntryValue } from "./types";
import { compiler } from "markdown-to-jsx";

import type { JSX } from "react";

export function flattenMarkdown(input: string): string {
  const compiled = compiler(input, {
    wrapper: null,
  }) as unknown as JSX.Element[];

  const flattened = compiled.reduce<string>((acc, cur) => {
    if (!cur) {
      return acc;
    }
    if (typeof cur === "string") {
      return acc.concat(cur);
    }
    if (typeof cur === "object") {
      if (cur.type === "Multiplyable") {
        return acc.concat(String(cur.props.baseNumber));
      }
      if (typeof cur.props.children === "string") {
        return acc.concat(cur.props.children);
      }
    }
    return acc;
  }, "");

  return flattened;
}

export default function buildRecipeIndexValue(
  recipe: Recipe,
): RecipeEntryValue {
  const { name, image, ingredients } = recipe;
  return {
    name,
    image,
    ingredients: ingredients?.map(({ ingredient }) =>
      flattenMarkdown(ingredient),
    ),
  };
}
