/*
 * Built-in themes. "Working Bench" is the default and derives to values close to
 * the hand-authored tokens in styles/theme.css; the alternates demonstrate the
 * knobs (accent hue, neutral family, radius, font pairing).
 */

import type { Theme } from "./types";

export interface Preset {
  key: string;
  label: string;
  theme: Theme;
}

export const WORKING_BENCH: Theme = {
  accentHue: 50, // copper ember
  neutral: "warm",
  radius: 0.5,
  fontPairing: "bench",
  defaultMode: "system",
};

export const PRESETS: Preset[] = [
  {
    key: "working-bench",
    label: "Working Bench",
    theme: WORKING_BENCH,
  },
  {
    key: "cool-steel",
    label: "Cool Steel",
    theme: {
      accentHue: 250, // steel blue
      neutral: "cool",
      radius: 0.5,
      fontPairing: "grotesk",
      defaultMode: "system",
    },
  },
  {
    key: "evergreen",
    label: "Evergreen",
    theme: {
      accentHue: 150, // pine
      neutral: "warm",
      radius: 0.75,
      fontPairing: "bench",
      defaultMode: "system",
    },
  },
  {
    key: "high-contrast",
    label: "High Contrast",
    theme: {
      accentHue: 265, // indigo
      neutral: "gray",
      radius: 0.25,
      fontPairing: "grotesk",
      defaultMode: "system",
    },
  },
];

export const DEFAULT_PRESET_KEY = "working-bench";

export function getPreset(key: string): Preset {
  return (
    PRESETS.find((p) => p.key === key) ??
    PRESETS.find((p) => p.key === DEFAULT_PRESET_KEY)!
  );
}
