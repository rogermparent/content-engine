import type { PaginationIndexConfig } from "@discontent/cms/pagination/types";
import { RECIPES_PER_PAGE } from "../components/RecipeIndexPage/constants";
import type { RecipeEntryKey, RecipeEntryValue } from "./types";

/**
 * What one row of the paginated recipe index renders — exactly the five fields
 * `RecipeListItem` destructures, and nothing else.
 *
 * The narrowness is the point, not an oversight. The projection is what a page
 * hash is taken over, so a field carried here that nobody renders would dirty
 * sealed pages every time it changed. `getRecipes` still drags descriptions,
 * ingredients and times through for the search corpus; that read is unaffected.
 */
export interface RecipeListEntry {
  slug: string;
  date: number;
  name: string;
  image?: string;
  tags?: string[];
}

/**
 * Recipes by date, newest first.
 *
 * Its own module rather than a field inside `recipeContentConfig.ts`: the
 * content config imports this, and this imports only *types* back, so there is
 * no cycle.
 */
export const recipesByDate: PaginationIndexConfig<
  RecipeEntryValue,
  RecipeEntryKey,
  RecipeListEntry
> = {
  name: "by-date",
  perPage: RECIPES_PER_PAGE,
  /*
   * Pinned rather than derived from the function source.
   *
   * The automatic spec hash covers `fn.toString()`, which a production build
   * minifies and a dev server does not. An index built by one and read by the
   * other therefore reads as stale and rebuilds itself — every page dirty,
   * every time. The Playwright fixtures are generated against `next dev` while
   * `e2e-start` runs the suite against a build, so that boundary is crossed on
   * every run; a real deployment crosses it whenever the editor and the export
   * build share a content directory. Bump this by hand when `key` or `project`
   * changes.
   */
  version: "1",
  /*
   * The date lives in the content index *key*, not the value — `buildIndexKey`
   * is `[date, slug]` while `RecipeEntryValue` carries no date at all. Both
   * functions below therefore read it from `entry.key`.
   */
  key: ({ key: [date], id }) => [date, id],
  project: ({ key: [date], value, id }) => ({
    slug: id,
    date,
    name: value.name,
    image: value.image,
    tags: value.tags,
  }),
};

export default recipesByDate;
