import { MassagedRecipeEntry } from "../../controller/data/read";
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

export function ClientListItem({
  recipe: { slug, date, name, image },
}: {
  recipe: MassagedRecipeEntry;
}) {
  return (
    <RecipeCard>
      <RecipeCardLink href={`/recipe/${slug}`}>
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
        <RecipeCardName>{name}</RecipeCardName>
        {date && <RecipeCardDate date={date} />}
      </RecipeCardLink>
    </RecipeCard>
  );
}

export default function ClientRecipeList({
  recipes,
}: {
  recipes: MassagedRecipeEntry[];
}) {
  return (
    <RecipeGrid>
      {recipes &&
        recipes.map((recipe) => {
          return (
            <li key={recipe.slug}>
              <ClientListItem recipe={recipe} />
            </li>
          );
        })}
    </RecipeGrid>
  );
}
