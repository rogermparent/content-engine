import { MassagedRecipeEntry } from "../../controller/data/read";
import { Fragment, ReactNode } from "react";
import { PureStaticImage } from "@discontent/next-static-image/src/Pure";
import { CardTags } from "./CardTags";
import {
  RecipeCard,
  RecipeCardImageContainer,
  RecipeCardName,
  RecipeCardDate,
  RecipeGrid,
  recipeCardImageClassName,
} from "../List/shared";

/** Max matched-ingredient lines shown on a card before collapsing to "+N more". */
const MAX_INGREDIENT_LINES = 3;

/**
 * Highlight the query's matching prefixes within `text`. A plain pure function
 * (not a hook), so it is safe to call in a loop — see the matched-ingredient
 * list below. Returns `false` when nothing matched.
 */
export function highlightText(text: string, query: string) {
  const queryWords = query.split(" ");
  const words = text.split(" ");
  let hasMatch = false;
  const lastIndex = words.length - 1;
  const wordComponents = words.map<ReactNode>((word, i) => {
    for (const queryWord of queryWords) {
      if (queryWord && word.toLowerCase().startsWith(queryWord.toLowerCase())) {
        hasMatch = true;
        const highlightedText = word.slice(0, queryWord.length);
        const otherText = word.slice(queryWord.length);
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
  recipe: { slug, date, name, ingredients, image, tags },
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
        {image && (
          <PureStaticImage
            slug={slug}
            image={image}
            alt="Recipe thumbnail"
            width={400}
            height={600}
            className={recipeCardImageClassName}
          />
        )}
      </RecipeCardImageContainer>
      <RecipeCardName>{maybeHighlightedName}</RecipeCardName>
      {date && <RecipeCardDate date={date} />}
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
