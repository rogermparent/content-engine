import Link from "next/link";
import { MassagedFeaturedRecipeEntry } from "../../../controller/data/readFeaturedRecipes";
import { RecipeImage } from "../../RecipeImage";
import Markdown from "component-library/components/Markdown";

function FeaturedRecipeListItem({
  slug,
  date,
  recipeName,
  recipeImage,
  recipeSlug,
  note,
}: MassagedFeaturedRecipeEntry & { recipeSlug: string }) {
  return (
    <div className="rounded-lg bg-slate-900 overflow-hidden w-full h-full text-sm">
      <Link
        href={`/recipe/${recipeSlug}`}
        className="block group flex flex-col flex-nowrap h-full"
      >
        <div className="w-full aspect-[2/3] overflow-hidden bg-gray-800">
          {recipeImage && (
            <RecipeImage
              slug={recipeSlug}
              image={recipeImage}
              alt="Recipe thumbnail"
              width={400}
              height={600}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
          )}
        </div>
        <div className="text-sm my-1 mx-2 line-clamp-2">{recipeName}</div>
        <div className="text-xs italic px-2 text-gray-400 mb-1">
          {new Date(date).toLocaleString()}
        </div>
      </Link>
      <div className="px-3 py-1 text-xs">
        <Link
          href={`/featured-recipes/${slug}`}
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
    </div>
  );
}

export default function FeaturedRecipeList({
  featuredRecipes,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
}) {
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {featuredRecipes.map((entry) => (
        <li key={entry.slug}>
          <FeaturedRecipeListItem {...entry} recipeSlug={entry.recipe} />
        </li>
      ))}
    </ul>
  );
}
