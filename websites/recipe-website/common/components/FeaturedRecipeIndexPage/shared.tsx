import Link from "next/link";
import FeaturedRecipeList from "../List/FeaturedRecipe";
import { MassagedFeaturedRecipeEntry } from "../../controller/data/readFeaturedRecipes";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

export function Pagination({
  pageNumber,
  more,
}: {
  pageNumber: number;
  more: boolean;
}) {
  const isFirstPage = pageNumber === 1;
  const previousHref =
    pageNumber === 2 ? "/featured-recipes" : `/featured-recipes/${pageNumber - 1}`;

  return (
    <div className="flex flex-row items-center justify-center font-semibold my-2">
      {isFirstPage ? (
        <Link href="/" className="text-center p-1 m-1 bg-slate-700 rounded-xs">
          Home
        </Link>
      ) : (
        <Link
          href={previousHref}
          className="text-center p-1 m-1 bg-slate-700 rounded-xs"
        >
          &larr;
        </Link>
      )}
      <span className="p-1 m-1">{pageNumber}</span>
      {more && (
        <Link
          href={`/featured-recipes/${pageNumber + 1}`}
          className="text-center p-1 m-1 bg-slate-700 rounded-xs"
        >
          &rarr;
        </Link>
      )}
    </div>
  );
}

export function FeaturedRecipeIndexPageWrapper({
  featuredRecipes,
  pageNumber,
  more,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
  pageNumber: number;
  more: boolean;
}) {
  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>Featured Recipes</PageHeading>
        {featuredRecipes && featuredRecipes.length > 0 ? (
          <div>
            <FeaturedRecipeList featuredRecipes={featuredRecipes} />
            <Pagination pageNumber={pageNumber} more={more} />
          </div>
        ) : (
          <p className="text-center my-4">There are no featured recipes yet.</p>
        )}
      </PageSection>
    </PageMain>
  );
}
