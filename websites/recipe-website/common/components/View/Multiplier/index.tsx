"use client";

import React, { ChangeEvent } from "react";

import { TextInput } from "component-library/components/Form/inputs/Text";
import { Recipe } from "../../../controller/types";
import { InfoCard } from "../shared";
import { useMultiplier } from "./Provider";
import { Multiplyable } from "./Multiplyable";
import StyledMarkdown from "component-library/components/Markdown";

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
  const { recipeYield } = recipe;

  return (
    recipeYield && (
      <InfoCard title="Yield">
        <StyledMarkdown components={{ Multiplyable }}>
          {recipeYield}
        </StyledMarkdown>
      </InfoCard>
    )
  );
}
