"use client";

import StyledMarkdown from "@discontent/component-library/components/Markdown";
import { Recipe } from "../../controller/types";
import { MultiplierProvider } from "../View/Multiplier/Provider";
import { MultiplierInput, MultipliedServings } from "../View/Multiplier";
import { Multiplyable } from "../View/Multiplier/Multiplyable";
import { CompactTimeline } from "./CompactTimeline";

/** How many ingredient lines the hero previews before "…and more". */
const PREVIEW_COUNT = 4;

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono tabular-nums text-sm text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * The hero's live panel — the overhaul's signature moment. Wrapped in a
 * MultiplierProvider so the scale control drives the featured recipe's
 * quantities (ingredient amounts + yield) in place, alongside its cook
 * durations and a read-only timeline strip. Everything here is the recipe's
 * own data, treated as the material.
 */
export function HeroLivePanel({ recipe }: { recipe: Recipe }) {
  const { ingredients, recipeYield, prepTime, cookTime, timelines } = recipe;
  const totalTime = recipe.totalTime || (prepTime || 0) + (cookTime || 0);

  const previewIngredients = (ingredients ?? []).slice(0, PREVIEW_COUNT);
  const remaining = (ingredients?.length ?? 0) - previewIngredients.length;
  const hasScalable = previewIngredients.length > 0 || Boolean(recipeYield);
  const hasDurations = Boolean(prepTime || cookTime || totalTime);

  return (
    <MultiplierProvider>
      <div className="flex flex-col gap-4">
        {hasScalable && (
          <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <MultiplierInput />
            <MultipliedServings recipe={recipe} />
          </div>
        )}

        {previewIngredients.length > 0 && (
          <ul className="flex flex-col gap-1 tabular-nums text-sm text-foreground/90">
            {previewIngredients.map(({ ingredient }, i) => (
              <li
                key={i}
                className="flex items-baseline gap-2 before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-primary/60"
              >
                <StyledMarkdown components={{ Multiplyable }}>
                  {ingredient}
                </StyledMarkdown>
              </li>
            ))}
            {remaining > 0 && (
              <li className="font-mono text-xs text-muted-foreground">
                +{remaining} more ingredient{remaining === 1 ? "" : "s"}
              </li>
            )}
          </ul>
        )}

        {hasDurations && (
          <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3">
            {prepTime ? (
              <Stat label="Prep" value={formatDuration(prepTime)} />
            ) : null}
            {cookTime ? (
              <Stat label="Cook" value={formatDuration(cookTime)} />
            ) : null}
            {totalTime ? (
              <Stat label="Total" value={formatDuration(totalTime)} />
            ) : null}
          </div>
        )}

        {timelines && timelines.length > 0 && (
          <CompactTimeline timelines={timelines} />
        )}
      </div>
    </MultiplierProvider>
  );
}

export default HeroLivePanel;
