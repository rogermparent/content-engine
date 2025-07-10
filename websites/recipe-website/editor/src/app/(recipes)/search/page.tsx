import { getRecipes } from "recipe-website-common/controller/data/read";
import { RECIPES_PER_SEARCH_PAGE } from "recipe-website-common/components/SearchForm/constants";
import { SearchForm } from "recipe-website-common/components/SearchForm";

export default async function Search() {
  const firstPage = await getRecipes({
    limit: RECIPES_PER_SEARCH_PAGE,
  });
  return (
    <main className="flex flex-col items-center h-full w-full p-2 max-w-prose lg:max-w-4xl mx-auto grow bg-slate-950">
      <div className="m-2 text-left w-full grow">
        <SearchForm firstPage={firstPage} />
      </div>
    </main>
  );
}
