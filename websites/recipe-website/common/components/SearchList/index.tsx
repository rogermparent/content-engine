import { MassagedRecipeEntry } from "../../controller/data/read";
import { Fragment, ReactNode } from "react";
import { PureStaticImage } from "@discontent/next-static-image/src/Pure";
import { CardTags } from "./CardTags";
import {
  RecipeCard,
  RecipeCardImageContainer,
  RecipeCardName,
  RecipeCardDate,
  RecipeCardPlaceholder,
  RecipeGrid,
  recipeCardImageClassName,
} from "../List/shared";

/** Max matched-ingredient lines shown on a card before collapsing to "+N more". */
const MAX_INGREDIENT_LINES = 3;

/**
 * Fold a string for matching: lowercase and diacritic-stripped, mirroring what
 * FlexSearch's default encoder does to the corpus. For precomposed (NFC) text —
 * what content files carry — this is length-preserving (é → e + ◌́ → e, one char
 * in, one char out), so a prefix length measured on the folded string still
 * indexes the original. The caller checks that anyway; see below.
 */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Highlight the query's matching prefixes within `text`. A plain pure function
 * (not a hook), so it is safe to call in a loop — see the matched-ingredient
 * list below. Returns `false` when nothing matched.
 *
 * Matching is accent-insensitive to stay in step with the engine: "creme"
 * *finds* "Crème Brûlée", so it has to visibly highlight it too.
 */
export function highlightText(text: string, query: string) {
  const queryWords = query.split(" ").map(fold);
  const words = text.split(" ");
  let hasMatch = false;
  const lastIndex = words.length - 1;
  const wordComponents = words.map<ReactNode>((word, i) => {
    const foldedWord = fold(word);
    for (const queryWord of queryWords) {
      if (queryWord && foldedWord.startsWith(queryWord)) {
        hasMatch = true;
        // The folded and raw strings only index alike when folding didn't change
        // the length (already-decomposed source text would shift it). When they
        // disagree, mark the whole word rather than slice at the wrong offset.
        const aligned = foldedWord.length === word.length;
        const splitAt = aligned ? queryWord.length : word.length;
        const highlightedText = word.slice(0, splitAt);
        const otherText = word.slice(splitAt);
        return (
          <Fragment key={i}>
            <mark>{highlightedText}</mark>
            {otherText}
            {i < lastIndex ? " " : null}
          </Fragment>
        );
      }
    }
    return <Fragment key={i}>{word} </Fragment>;
  });
  return hasMatch && wordComponents;
}

export function SearchListItem({
  recipe,
  recipe: { slug, date, name, description, ingredients, image, tags },
  query,
  renderItemWrapper,
}: {
  recipe: MassagedRecipeEntry;
  query: string;
  renderItemWrapper: (
    recipe: MassagedRecipeEntry,
    content: ReactNode,
  ) => ReactNode;
}) {
  const maybeHighlightedName = highlightText(name, query) || name;

  // Only ingredients that actually match the query render a highlighted line.
  // Cap the visible lines so a match-heavy recipe can't stretch its grid row;
  // the remainder collapses to a muted "+N more".
  const matchedIngredients: ReactNode[] = [];
  for (const ingredient of ingredients ?? []) {
    const nodes = highlightText(ingredient, query);
    if (nodes) matchedIngredients.push(nodes);
  }
  const visibleIngredients = matchedIngredients.slice(0, MAX_INGREDIENT_LINES);
  const hiddenCount = matchedIngredients.length - visibleIngredients.length;

  const content = (
    <>
      <RecipeCardImageContainer>
        {image ? (
          <PureStaticImage
            slug={slug}
            image={image}
            alt="Recipe thumbnail"
            width={400}
            height={600}
            className={recipeCardImageClassName}
          />
        ) : (
          <RecipeCardPlaceholder name={name} />
        )}
      </RecipeCardImageContainer>
      <RecipeCardName>{maybeHighlightedName}</RecipeCardName>
      {date && <RecipeCardDate date={date} />}
      {description && (
        <p className="my-0.5 mx-2 line-clamp-2 text-xs text-muted-foreground">
          {highlightText(description, query) || description}
        </p>
      )}
      {visibleIngredients.length > 0 && (
        <ul className="my-0.5 mx-2 text-xs overflow-hidden">
          {visibleIngredients.map((nodes, i) => (
            <li key={i} className="my-1 line-clamp-1">
              {nodes}
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="my-1 text-muted-foreground">+{hiddenCount} more</li>
          )}
        </ul>
      )}
    </>
  );

  return (
    <RecipeCard>
      {renderItemWrapper(recipe, content)}
      {tags && tags.length > 0 && <CardTags tags={tags} />}
    </RecipeCard>
  );
}

export default function SearchList({
  recipeResults,
  query,
  renderItemWrapper,
}: {
  recipeResults?: MassagedRecipeEntry[];
  query: string;
  renderItemWrapper: (
    recipe: MassagedRecipeEntry,
    content: ReactNode,
  ) => ReactNode;
}) {
  return (
    <RecipeGrid>
      {recipeResults &&
        recipeResults.map((recipe) => {
          return recipe ? (
            <li key={recipe.slug}>
              <SearchListItem
                recipe={recipe}
                query={query}
                renderItemWrapper={renderItemWrapper}
              />
            </li>
          ) : null;
        })}
    </RecipeGrid>
  );
}
