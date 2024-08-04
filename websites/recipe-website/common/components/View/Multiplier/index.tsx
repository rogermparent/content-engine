"use client";

import React, { ChangeEvent } from "react";

import { TextInput } from "component-library/components/Form/inputs/Text";
import { Ingredient, Recipe } from "../../../controller/types";
import { InfoCard } from "../shared";
import { useMultiplier } from "./Provider";
import StyledMarkdown from "component-library/components/Markdown";
import { Multiplyable } from "./Multiplyable";
import { PaddedButton } from "component-library/components/Button";

export function IngredientItem({ ingredient }: { ingredient?: string }) {
  return (
    <li>
      <label className="my-2 block flex flex-row flex-nowrap items-center print:h-auto">
        <input
          type="checkbox"
          className="h-4 w-4 m-2 inline-block shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />{" "}
        {ingredient && (
          <StyledMarkdown components={{ Multiplyable }}>
            {ingredient}
          </StyledMarkdown>
        )}
      </label>
    </li>
  );
}

export function Ingredients({ ingredients }: { ingredients?: Ingredient[] }) {
  return (
    <form className="w-full max-w-prose mx-auto lg:max-w-96 lg:mr-4 lg:ml-0 print:text-sm print:w-96">
      {ingredients && (
        <div className="my-4">
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
            {ingredients.map(({ ingredient }, i) => (
              <IngredientItem key={i} ingredient={ingredient} />
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

export function MultiplierInput() {
  const [{ input }, setMultiplier] = useMultiplier();

  return (
    <label htmlFor="multiplier" className="w-24 print:hidden">
      <InfoCard title="Multiply">
        <TextInput
          id="multiplier"
          name="multiplier"
          defaultValue={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setMultiplier(e.target.value);
          }}
        />
      </InfoCard>
    </label>
  );
}

export function MultipliedServings({ recipe }: { recipe: Recipe }) {
  const { servings, servingSize } = recipe;

  const [{ multiplier }] = useMultiplier();

  const multipliedServings =
    multiplier && servings
      ? multiplier.mul(servings).toFraction(true)
      : servings;

  return (
    multipliedServings && (
      <InfoCard title="Servings">
        <span>{multipliedServings}</span>{" "}
        {servingSize && <span>{servingSize}</span>}
      </InfoCard>
    )
  );
}
