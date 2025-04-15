import type { Ingredient } from "../controller/types";

export function createIngredient(inputLine: string): Ingredient | undefined {
  const trimmedInputLine = inputLine
    .replace(/^[ \t\r\n\f*\-•▪]*/, "")
    .trim()
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
