import { MassagedRecipeEntry } from "../../controller/data/read";
import { Fragment, ReactNode } from "react";
import { PureStaticImage } from "next-static-image/src/Pure";
import {
  RecipeCard,
  RecipeCardLink,
  RecipeCardImageContainer,
  RecipeCardName,
  RecipeCardDate,
  RecipeGrid,
  recipeCardImageClassName,
} from "../List/shared";

export function useHighlightedText(text: string, query: string) {
  const queryWords = query.split(" ");
  const words = text.split(" ");
  let hasMatch = false;
  const lastIndex = words.length - 1;
  const wordComponents = words.map<ReactNode>((word, i) => {
    for (const queryWord of queryWords) {
      if (word.toLowerCase().startsWith(queryWord.toLowerCase())) {
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

function HighlightedIngredient({
  ingredient,
  query,
}: {
  ingredient: string;
  query: string;
}) {
  const text = useHighlightedText(ingredient, query);
  return text && <li className="my-1">{text}</li>;
}

export function SearchListItem({
  recipe,
  recipe: { slug, date, name, ingredients, image },
  query,
  onRecipeSelect,
  isModal = false,
}: {
  recipe: MassagedRecipeEntry;
  query: string;
  onRecipeSelect?: (recipe: MassagedRecipeEntry) => void;
  isModal?: boolean;
}) {
  const maybeHighlightedName = useHighlightedText(name, query) || name;
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
      {ingredients && (
        <ul className="my-0.5 mx-2 text-xs">
          {ingredients.map((ingredient, i) => (
            <HighlightedIngredient
              ingredient={ingredient}
              query={query}
              key={i}
            />
          ))}
        </ul>
      )}
    </>
  );

  return (
    <RecipeCard>
      {isModal && onRecipeSelect ? (
        <button
          type="button"
          onClick={() => onRecipeSelect(recipe)}
          className="text-left w-full h-full block"
        >
          {content}
        </button>
      ) : (
        <RecipeCardLink href={`/recipe/${slug}`}>{content}</RecipeCardLink>
      )}
    </RecipeCard>
  );
}

export default function SearchList({
  recipeResults,
  query,
  onRecipeSelect,
  isModal = false,
}: {
  recipeResults: MassagedRecipeEntry[];
  query: string;
  onRecipeSelect?: (recipe: MassagedRecipeEntry) => void;
  isModal?: boolean;
}) {
  return (
    <RecipeGrid>
      {recipeResults &&
        recipeResults.map((recipe) => {
          return (
            <li key={recipe.slug}>
              <SearchListItem
                recipe={recipe}
                query={query}
                onRecipeSelect={onRecipeSelect}
                isModal={isModal}
              />
            </li>
          );
        })}
    </RecipeGrid>
  );
}
