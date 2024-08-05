"use client";

import React, { ReactNode, Reducer, useReducer } from "react";
import Fraction from "fraction.js";

interface MultiplierState {
  multiplier?: Fraction;
  input?: string;
}

const MultiplierContext = React.createContext<
  [MultiplierState, React.Dispatch<string>] | undefined
>(undefined);

const multiplierInputReducer: Reducer<MultiplierState, string> = (
  state,
  input,
) => {
  if (input === state.input) {
    return state;
  }
  if (!input || input === "1") {
    return { multiplier: undefined, input };
  }
  try {
    const multiplier = new Fraction(input);
    return { multiplier, input };
  } catch {
    return state;
  }
};

export function MultiplierProvider({ children }: { children: ReactNode }) {
  const [multiplierState, setMultiplier] = useReducer(
    multiplierInputReducer,
    {},
  );

  return (
    <MultiplierContext.Provider value={[multiplierState, setMultiplier]}>
      {children}
    </MultiplierContext.Provider>
  );
}

export function useMultiplier() {
  const context = React.useContext(MultiplierContext);
  if (context === undefined) {
    throw new Error("useMultiplier must be used within a MultiplierProvider");
  }
  return context;
}
