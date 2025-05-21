import type { Ingredient } from "../controller/types";

export function createIngredient(inputLine: string): Ingredient | undefined {
  const trimmedInputLine = inputLine
    .replace(/^[ \t\r\n\f*\-•▪]*/, "")
    .trim()
    .replaceAll(
      /[^ ]([\u00BC-\u00BE\u2150-\u215E\u2189]|[\u215F][0-9]+)/g,
      ([firstChar, ...rest]) => `${firstChar} ${rest.join("")}`,
    )
    .normalize("NFKD")
    .replaceAll("⁄", "/")
    .replaceAll(/ +/g, " ");

  if (trimmedInputLine) {
    const isHeading = trimmedInputLine.endsWith(":");

    const multiplyableIngredient = trimmedInputLine.replace(
      /[0-9]+(?:\/[0-9]+|(?: and)? [0-9]+\/[0-9]+|\.[0-9]+)?(?![0-9]*(?:\.[0-9]+)? *%)/g,
      (match) => {
        const normalizedMatch = match.replace(" and", "");
        return `<Multiplyable baseNumber="${normalizedMatch}" />`;
      },
    );

    return {
      ingredient: multiplyableIngredient,
      ...(isHeading && { type: "heading" }),
    };
  }
}

export function createIngredients(input: string) {
  return input
    .split(/\n+/)
    .map(createIngredient)
    .filter(Boolean) as Ingredient[];
}
