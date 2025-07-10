"use client";

import React, { ChangeEvent } from "react";

import { TextInput } from "component-library/components/Form/inputs/Text";
import { Recipe } from "../../../controller/types";
import { InfoCard } from "../shared";
import { useMultiplier } from "./Provider";

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
