import { MassagedRecipeEntry } from "../../controller/data/read";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { PureStaticImage } from "next-static-image/src/Pure";

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
  recipe: { slug, date, name, ingredients, image },
  query,
}: {
  recipe: MassagedRecipeEntry;
  query: string;
}) {
  const maybeHighlightedName = useHighlightedText(name, query) || name;
  return (
    <div className="my-1 rounded-lg bg-slate-900 overflow-hidden w-full h-full text-sm md:text-xs">
      <Link
        href={`/recipe/${slug}`}
        className="block group flex flex-col flex-nowrap h-full"
      >
        <div className="w-full h-64 sm:h-40 overflow-hidden bg-gray-800">
          {image && (
            <PureStaticImage
              slug={slug}
              image={image}
              alt="Recipe thumbnail"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          )}
        </div>
        <h3 className="my-1 mx-3">{maybeHighlightedName}</h3>
        <div className="italic px-2 text-gray-400 my-1">
          {date && new Date(date).toLocaleString()}
        </div>
        {ingredients && (
          <ul className="my-0.5 mx-2">
            {ingredients.map((ingredient, i) => (
              <HighlightedIngredient
                ingredient={ingredient}
                query={query}
                key={i}
              />
            ))}
          </ul>
        )}
      </Link>
    </div>
  );
}

export default function SearchList({
  recipeResults,
  query,
}: {
  recipeResults: MassagedRecipeEntry[];
  query: string;
}) {
  return (
    <ul className="mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-center">
      {recipeResults &&
        recipeResults.map((recipe) => {
          return (
            <li
              key={recipe.slug}
              className="w-full sm:p-1 sm:w-1/2 md:w-1/3 lg:w-1/4"
            >
              <SearchListItem recipe={recipe} query={query} />
            </li>
          );
        })}
    </ul>
  );
}
