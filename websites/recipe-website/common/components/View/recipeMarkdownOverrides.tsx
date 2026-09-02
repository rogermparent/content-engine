import { Multiplyable } from "./Multiplier/Multiplyable";
import { VideoTime } from "./Instructions/VideoTime";

/**
 * The markdown overrides every recipe prose surface needs, in one place, so a
 * field never renders `<VideoTime>` or `<Multiplyable>` as an unknown element
 * because a call site forgot one of them.
 *
 * `recipeMarkdownComponents` is for surfaces inside the recipe view's
 * providers: quantities scale with the multiplier and timestamps seek the
 * video player.
 *
 * `staticRecipeMarkdownComponents` is for surfaces outside them (homepage
 * hero, featured notes, form previews): quantities render their base number
 * verbatim and timestamps degrade to inert text (VideoTime detects the
 * missing player itself).
 */
export const recipeMarkdownComponents = {
  Multiplyable,
  VideoTime,
};

/** Renders the base number verbatim; no MultiplierProvider needed. */
export function StaticMultiplyable({
  baseNumber,
}: {
  baseNumber: string | number;
}) {
  return <>{baseNumber}</>;
}

export const staticRecipeMarkdownComponents = {
  Multiplyable: StaticMultiplyable,
  VideoTime,
};
