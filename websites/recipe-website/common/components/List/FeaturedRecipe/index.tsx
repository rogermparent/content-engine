import Link from "next/link";
import { MassagedFeaturedRecipeEntry } from "../../../controller/data/readFeaturedRecipes";
import { RecipeImage } from "../../RecipeImage";
import Markdown from "component-library/components/Markdown";

export function FeaturedRecipeListItem({
  slug,
  date,
  recipeName,
  recipeImage,
  recipeSlug,
  showNote,
  note,
  showViewFeatureLink,
}: MassagedFeaturedRecipeEntry & {
  recipeSlug: string;
  showNote?: boolean;
  showViewFeatureLink?: boolean;
}) {
  return (
    <div className="my-1 rounded-lg bg-slate-900 overflow-hidden w-full h-full md:text-sm">
      <Link
        href={`/recipe/${recipeSlug}`}
        className="block group flex flex-col flex-nowrap h-full"
      >
        <div className="w-full h-64 sm:h-40 overflow-hidden bg-gray-800">
          {recipeImage && (
            <RecipeImage
              slug={recipeSlug}
              image={recipeImage}
              alt="Recipe thumbnail"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
        <div className="sm:text-sm my-1 mx-3 sm:h-12 md:text-xs">{recipeName}</div>
        <div className="text-sm italic px-2 text-gray-400 my-1 sm:h-5">
          {new Date(date).toLocaleString()}
        </div>
      </Link>
      {showViewFeatureLink && (
        <div className="px-3 py-1 text-xs">
          <Link
            href={`/featured-recipes/${slug}`}
            className="text-blue-400 hover:text-blue-300 hover:underline"
          >
            View Feature
          </Link>
        </div>
      )}
      {showNote && note && (
        <div className="px-3 py-2 text-sm prose prose-invert max-w-none">
          <Markdown>{note}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function FeaturedRecipeList({
  featuredRecipes,
  showNote = false,
  showViewFeatureLink = false,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
  showNote?: boolean;
  showViewFeatureLink?: boolean;
}) {
  return (
    <ul className="mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-center">
      {featuredRecipes.map((entry) => {
        const { date, slug, recipeName, recipeImage, recipe } = entry;
        return (
          <li key={slug} className="w-full sm:p-1 sm:w-1/2 md:w-1/3 lg:w-1/4">
            <FeaturedRecipeListItem
              {...entry}
              recipeSlug={recipe}
              showNote={showNote}
              showViewFeatureLink={showViewFeatureLink}
            />
          </li>
        );
      })}
    </ul>
  );
}

