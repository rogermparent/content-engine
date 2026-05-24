"use client";

import React, { useState } from "react";

import { Ingredient } from "../../../controller/types";
import { Multiplyable } from "../Multiplier/Multiplyable";
import StyledMarkdown from "@discontent/component-library/components/Markdown";
import { Button } from "@discontent/component-library/components/ui/button";
import { Checkbox } from "@discontent/component-library/components/ui/checkbox";

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

  // Otherwise, render the standard ingredient item. The Checkbox is a labelable
  // control, so clicking anywhere in the wrapping label toggles it.
  return (
    <li>
      <label className="my-2 flex flex-row flex-nowrap items-center gap-2 print:h-auto">
        <Checkbox className="m-2 shrink-0" />
        <StyledMarkdown components={{ Multiplyable }}>
          {ingredient}
        </StyledMarkdown>
      </label>
    </li>
  );
}

export function Ingredients({ ingredients }: { ingredients?: Ingredient[] }) {
  // Reset clears the checklist by remounting the list (the checkboxes are
  // uncontrolled, so remounting returns them to their default unchecked state).
  const [resetKey, setResetKey] = useState(0);

  return (
    ingredients && (
      <section className="w-full max-w-xl mx-auto lg:max-w-96 lg:mr-4 lg:ml-0 print:text-sm print:w-96 bg-card rounded-md px-4 py-1 mb-2">
        <h2 className="text-xl font-bold flex flex-row flex-nowrap items-center">
          Ingredients
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="ml-2 print:hidden"
            onClick={() => setResetKey((k) => k + 1)}
          >
            Reset
          </Button>
        </h2>
        <ul key={resetKey} className="text-lg print:text-sm">
          {ingredients.map(({ ingredient, type }, i) => (
            <IngredientItem key={i} ingredient={ingredient} type={type} />
          ))}
        </ul>
      </section>
    )
  );
}
