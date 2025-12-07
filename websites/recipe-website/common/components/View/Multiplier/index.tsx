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
  const { servings, servingSize } = recipe;

  const [{ multiplier }] = useMultiplier();

  const multipliedServings =
    multiplier && servings
      ? multiplier.mul(servings).toFraction(true)
      : servings;

  return (
    (multipliedServings || servingSize) && (
      <InfoCard title="Servings">
        {multipliedServings && <span>{multipliedServings}</span>}{" "}
        {servingSize && (
          <StyledMarkdown components={{ Multiplyable }}>
            {servingSize}
          </StyledMarkdown>
        )}
      </InfoCard>
    )
  );
}
