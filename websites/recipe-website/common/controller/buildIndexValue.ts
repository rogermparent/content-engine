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
 * display field — a few sentences carry the distinguishing terms, and this
 * field is on the unconditional page-load path: `/search/all` ships it to every
 * client (it is what the ⌘K palette renders as a subtitle), so an uncapped body
 * would bloat every page load for no matching benefit.
 *
 * `ingredients` below is *not* on that path since F4a — it is served separately
 * by `/search/ingredients`, fetched only when the index needs populating or a
 * filter asks for it — which is why it has no cap and needs none.
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
