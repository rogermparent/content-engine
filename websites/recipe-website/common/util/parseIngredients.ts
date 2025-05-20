import type { Ingredient } from "../controller/types";

function splitParentheses(input: string) {
  const segments = [];
  let isInParentheses = false;
  let start = 0;
  let level = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "(") {
      if (level === 0) {
        isInParentheses = true;
        const contentStart = i + 1;
        segments.push(input.slice(start, contentStart));
        start = contentStart;
      }
      level += 1;
    } else if (char === ")") {
      if (level > 0) {
        level -= 1;
      }
      if (level <= 0 && isInParentheses) {
        isInParentheses = false;
        const contentEnd = i;
        segments.push(input.slice(start, contentEnd));
        start = contentEnd;
      }
    }
  }
  if (start < input.length) {
    segments.push(input.slice(start, input.length));
  }
  return segments;
}

function shouldBePerServing(segments: string[]) {
  for (let i = 0; i < segments.length; i += 2) {
    const segment = segments[i];
    if (segment.match(/[ 0-9](per|each|ea\.)([ \)]|$)/)) {
      return true;
    }
  }
  return false;
}

function findParenthesesForward(input: string, index: number) {
  let level = 0;
  for (let i = index; i <= input.length; i++) {
    const char = input[i];
    if (char === ")") {
      if (level === 0) {
        return i + 1;
      } else {
        level -= 1;
      }
    } else if (char === "(") {
      level += 1;
    }
  }
}

function findParenthesesBackward(input: string, index: number) {
  let level = 0;
  for (let i = index; i >= 0; i--) {
    const char = input[i];
    if (char === "(") {
      if (level === 0) {
        return i;
      } else {
        level -= 1;
      }
    } else if (char === ")") {
      level += 1;
    }
  }
}

function addMultipliers(input: string): string {
  const perServingKeywordRegex = /([ 0-9](?:per|each|ea\.)(?:[ \)]|$))/gi;
  let keyword;
  while ((keyword = perServingKeywordRegex.exec(input))) {
    const parenStart = findParenthesesBackward(input, keyword.index);
    const parenEnd = findParenthesesForward(input, keyword.index);
    if (parenStart === undefined || parenEnd === undefined) {
      console.log("broken parens", parenStart);
    }
    console.log([
      parenStart !== undefined && input.slice(0, parenStart),
      input.slice(parenStart, parenEnd),
      parenEnd !== undefined && input.slice(parenEnd),
    ]);
    perServingKeywordRegex.lastIndex =
      parenEnd === undefined ? input.length : parenEnd;
  }

  return input;

  const segments = splitParentheses(input);
  let isPerServing = shouldBePerServing(segments);
  if (isPerServing) {
    return input;
  } else {
    const newSegments = segments.map((segment, i) => {
      return i % 2 === 0
        ? segment.replace(
            /[0-9]+(?:\/[0-9]+|(?: and)? [0-9]+\/[0-9]+|\.[0-9]+)?(?![0-9]*(?:\.[0-9]+)? *%)(?![^(]*\([^)]*(?:each|per|ea\.)[^)]*\))/gi,
            (match) => {
              const normalizedMatch = match.replace(" and", "");
              return `<Multiplyable baseNumber="${normalizedMatch}" />`;
            },
          )
        : addMultipliers(segment);
    });
    return newSegments.join("");
  }
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

    const multiplyableIngredient = addMultipliers(trimmedInputLine);

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
