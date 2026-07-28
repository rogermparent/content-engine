import { Recipe, RecipeEntryValue } from "./types";
import { compiler } from "markdown-to-jsx/react";

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

/**
 * Cap on the indexed description. The description is searchable prose, not a
 * display field — a few sentences carry the distinguishing terms, and the whole
 * index is shipped to the client via `/search/all`, so an uncapped body would
 * bloat every page load for no matching benefit.
 */
const MAX_INDEXED_DESCRIPTION_LENGTH = 300;

export default function buildRecipeIndexValue(
  recipe: Recipe,
): RecipeEntryValue {
  const {
    name,
    description,
    image,
    ingredients,
    tags,
    prepTime,
    cookTime,
    totalTime,
  } = recipe;
  const flatDescription = description
    ? flattenMarkdown(description).slice(0, MAX_INDEXED_DESCRIPTION_LENGTH)
    : undefined;
  return {
    name,
    description: flatDescription || undefined,
    image,
    ingredients: ingredients?.map(({ ingredient }) =>
      flattenMarkdown(ingredient),
    ),
    tags: tags && tags.length > 0 ? tags : undefined,
    prepTime: prepTime || undefined,
    cookTime: cookTime || undefined,
    totalTime: totalTime || undefined,
  };
}
