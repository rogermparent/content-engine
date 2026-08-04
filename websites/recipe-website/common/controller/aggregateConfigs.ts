import type { AggregateConfig } from "@discontent/cms/aggregates/types";
import type { RecipeEntryKey, RecipeEntryValue } from "./types";

/**
 * Every tag in the corpus, deduped and sorted.
 *
 * Its own module rather than a field inside `recipeContentConfig.ts`: the
 * content config imports this, and this imports only *types* back, so there is
 * no cycle — the same split `paginationConfigs.ts` uses.
 *
 * Folds the content index *value*, which already carries `tags` because
 * `buildIndexValue` copies it for the search corpus. So adopting this needed no
 * index-shape change and therefore no forced rebuild — the fixtures only have
 * to gain the aggregate record itself.
 */
export const recipeTags: AggregateConfig<
  RecipeEntryValue,
  RecipeEntryKey,
  Set<string>,
  string[]
> = {
  name: "tags",
  /*
   * Pinned rather than derived from the function source, for the reason
   * `recipesByDate.version` spells out at length: the automatic spec hash
   * covers `fn.toString()`, which a production build minifies and a dev server
   * does not, so a value folded by one and read by the other would rewrite
   * itself on every pass. Bump by hand when the fold changes.
   */
  version: "1",
  /*
   * A `Set` accumulator, a sorted array as the value. Sorting in `finalize`
   * rather than at the call site is load-bearing: the value is hashed, and an
   * unstable order would read as a change on every write.
   */
  initial: () => new Set<string>(),
  fold: (tags, { value }) => {
    for (const tag of value.tags ?? []) tags.add(tag);
    return tags;
  },
  finalize: (tags) => [...tags].sort(),
};

export default recipeTags;
