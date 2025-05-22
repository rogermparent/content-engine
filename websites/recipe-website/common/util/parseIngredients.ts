import type { Ingredient } from "../controller/types";

function addMultipliersToNumbers(input: string) {
  return input.replace(
    /[0-9]+(?:\/[0-9]+|(?: and)? [0-9]+\/[0-9]+|\.[0-9]+)?(?![0-9]*(?:\.[0-9]+)? *%)/g,
    (match) => {
      const normalizedMatch = match.replace(" and", "");
      return `<Multiplyable baseNumber="${normalizedMatch}" />`;
    },
  );
}

const perServingRegex = /[ 0-9\(](per|each|ea\.)([ \)]|$)/;

function splitParentheses(input: string): string {
  let start = 0;
  let parenStart = 0;
  let parenEnd = 0;
  let level = 0;
  let segments = [];
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (character === "(") {
      if (level === 0) {
        parenStart = i + 1;
      }
      level += 1;
    }
    if (character === ")") {
      if (level === 1) {
        parenEnd = i;
        const initialSegment = input.slice(start, parenStart);
        const parenSegment = input.slice(parenStart, parenEnd);

        if (initialSegment.match(perServingRegex)) {
          return input;
        }

        start = parenEnd;
        parenStart = parenEnd;
        segments.push(initialSegment);
        segments.push(parenSegment);
      }
      if (level > 0) {
        level -= 1;
      }
    }
  }

  const finalSegment = input.slice(start);
  if (finalSegment.match(perServingRegex)) {
    return input;
  }

  segments.push(finalSegment);
  return segments
    .map((segment, i) => {
      return i % 2 === 0
        ? addMultipliersToNumbers(segment)
        : splitParentheses(segment);
    })
    .join("");
}

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

    const multiplyableIngredient = splitParentheses(trimmedInputLine);

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
