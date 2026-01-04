"use client";

import React from "react";

import { Ingredient } from "../../../controller/types";
import { Multiplyable } from "../Multiplier/Multiplyable";
import StyledMarkdown from "component-library/components/Markdown";
import { PaddedButton } from "component-library/components/Button";

export function IngredientItem({ ingredient, type }: Ingredient) {
  // If the ingredient is a heading, render it as such
  if (type === "heading") {
    return (
      <li>
        <h3 className="my-2 text-lg font-semibold">
          <StyledMarkdown components={{ Multiplyable }}>
            {ingredient}
          </StyledMarkdown>
        </h3>
      </li>
    );
  }

  // Otherwise, render the standard ingredient item
  return (
    <li>
      <label className="my-2 block flex flex-row flex-nowrap items-center print:h-auto">
        <input
          type="checkbox"
          className="h-4 w-4 m-2 inline-block shrink-0 rounded-xs border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />{" "}
        <StyledMarkdown components={{ Multiplyable }}>
          {ingredient}
        </StyledMarkdown>
      </label>
    </li>
  );
}

// Update how Ingredients component maps over the ingredients
export function Ingredients({ ingredients }: { ingredients?: Ingredient[] }) {
  return (
    ingredients && (
      <form className="w-full max-w-xl mx-auto lg:max-w-96 lg:mr-4 lg:ml-0 print:text-sm print:w-96 bg-slate-800 rounded-md px-4 py-1 mb-2">
        <h2 className="text-xl font-bold flex flex-row flex-nowrap items-center">
          Ingredients
          <PaddedButton
            className="ml-2 h-12 text-base print:hidden"
            type="reset"
          >
            Reset
          </PaddedButton>
        </h2>
        <ul className="text-lg print:text-sm">
          {ingredients.map(({ ingredient, type }, i) => (
            <IngredientItem key={i} ingredient={ingredient} type={type} />
          ))}
        </ul>
      </form>
    )
  );
}
