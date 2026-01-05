import Link from "next/link";
import RecipeList from "../List";
import { MassagedRecipeEntry } from "../../controller/data/read";

export function Pagination({
  pageNumber,
  more,
}: {
  pageNumber: number;
  more: boolean;
}) {
  const isFirstPage = pageNumber === 1;
  const previousHref =
    pageNumber === 2 ? "/recipes" : `/recipes/${pageNumber - 1}`;

  return (
    <div className="flex flex-row items-center justify-center font-semibold">
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
          href={`/recipes/${pageNumber + 1}`}
          className="text-center p-1 m-1 bg-slate-700 rounded-xs"
        >
          &rarr;
        </Link>
      )}
    </div>
  );
}

export function RecipeIndexPageWrapper({
  recipes,
  pageNumber,
  more,
}: {
  recipes: MassagedRecipeEntry[];
  pageNumber: number;
  more: boolean;
}) {
  return (
    <main className="flex flex-col items-center w-full p-2 max-w-4xl mx-auto grow">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl">All Recipes</h2>
        {recipes && recipes.length > 0 ? (
          <div>
            <RecipeList recipes={recipes} />
            <Pagination pageNumber={pageNumber} more={more} />
          </div>
        ) : (
          <p className="text-center my-4">There are no recipes yet.</p>
        )}
      </div>
    </main>
  );
}
