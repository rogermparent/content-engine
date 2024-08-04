"use client";
import Fraction from "fraction.js";
import { useMultiplier } from "../Provider";
import { useMemo } from "react";

function getFraction(quantity: string | number | undefined) {
  if (quantity) {
    try {
      return new Fraction(quantity);
    } catch (e) {
      console.error(`Given quantity ${quantity} couldn't be parsed!`);
    }
  }
  return undefined;
}

export function Multiplyable({ baseNumber }: { baseNumber: string | number }) {
  const input = useMemo(() => getFraction(baseNumber), [baseNumber]);
  const [{ multiplier }] = useMultiplier();

  return (
    <>
      {multiplier && input
        ? multiplier.mul(input).toFraction(true)
        : input?.toFraction(true)}
    </>
  );
}
