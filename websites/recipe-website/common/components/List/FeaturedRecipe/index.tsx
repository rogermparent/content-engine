import Link from "next/link";
import { MassagedFeaturedRecipeEntry } from "../../../controller/data/readFeaturedRecipes";
import { RecipeImage } from "../../RecipeImage";
import Markdown from "component-library/components/Markdown";
import {
  RecipeCard,
  RecipeCardLink,
  RecipeCardImageContainer,
  RecipeCardName,
  RecipeCardDate,
  RecipeGrid,
  recipeCardImageClassName,
  standardRecipeImageProps,
} from "../shared";

function FeaturedRecipeListItem({
  slug,
  date,
  recipeName,
  recipeImage,
  recipeSlug,
  note,
}: MassagedFeaturedRecipeEntry & { recipeSlug: string }) {
  return (
    <RecipeCard>
      <RecipeCardLink href={`/recipe/${recipeSlug}`}>
        <RecipeCardImageContainer>
          {recipeImage && (
            <RecipeImage
              slug={recipeSlug}
              image={recipeImage}
              alt="Recipe thumbnail"
              className={recipeCardImageClassName}
              {...standardRecipeImageProps}
            />
          )}
        </RecipeCardImageContainer>
        <RecipeCardName className="line-clamp-2">{recipeName}</RecipeCardName>
        <RecipeCardDate date={date} showTime />
      </RecipeCardLink>
      <div className="px-3 py-1 text-xs">
        <Link
          href={`/featured-recipe/${slug}`}
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          View Feature
        </Link>
      </div>
      {note && (
        <div className="px-3 py-2 text-sm prose prose-invert max-w-none">
          <Markdown>{note}</Markdown>
        </div>
      )}
    </RecipeCard>
  );
}

export default function FeaturedRecipeList({
  featuredRecipes,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
}) {
  return (
    <RecipeGrid>
      {featuredRecipes.map((entry) => (
        <li key={entry.slug}>
          <FeaturedRecipeListItem {...entry} recipeSlug={entry.recipe} />
        </li>
      ))}
    </RecipeGrid>
  );
}
