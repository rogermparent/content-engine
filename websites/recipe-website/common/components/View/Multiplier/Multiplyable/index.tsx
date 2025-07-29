"use client";
import Fraction from "fraction.js";
import { useMultiplier } from "../Provider";
import { useMemo } from "react";

function getFraction(quantity: string | number | undefined) {
  if (quantity) {
    try {
      return new Fraction(quantity);
    } catch {
      console.error(`Given quantity ${quantity} couldn't be parsed!`);
    }
  }
  return undefined;
}

enum MultiplyableInputTypes {
  DECIMAL,
  FRACTION,
}

export function Multiplyable({ baseNumber }: { baseNumber: string | number }) {
  const fraction = useMemo(() => getFraction(baseNumber), [baseNumber]);
  const inputType =
    typeof baseNumber === "string" && baseNumber.includes(".")
      ? MultiplyableInputTypes.DECIMAL
      : MultiplyableInputTypes.FRACTION;
  const [{ multiplier }] = useMultiplier();

  const displayNumber =
    fraction && multiplier && multiplier.mul(fraction).simplify(0.01);

  return (
    <>
      {displayNumber
        ? inputType === MultiplyableInputTypes.FRACTION
          ? displayNumber.simplify(0.0125).toFraction(true)
          : displayNumber.round(3).toString()
        : baseNumber}
    </>
  );
}
