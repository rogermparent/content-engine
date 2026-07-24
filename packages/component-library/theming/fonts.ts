/*
 * The font-pairing menu.
 *
 * next/font runs at build time and can only switch among a pre-registered set,
 * so the actual typefaces are loaded in the app's AppLayout/fonts.ts onto the
 * CSS variables named here. This module is the shared *contract*: the menu keys,
 * their human labels, and the `--ff-*-<key>` variable names each pairing binds.
 *
 * derive.ts turns a theme's `fontPairing` into role overrides:
 *   --ff-display: var(--ff-display-<key>)  (likewise -body / -mono)
 * and the default binding lives in styles/theme.css so the no-theme path still
 * resolves to the "bench" pairing.
 */

export interface FontPairing {
  key: string;
  label: string;
  /** CSS variable names (with leading `--`) the app registers for this pairing. */
  display: string;
  body: string;
  mono: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    key: "bench",
    label: "Working Bench",
    display: "--ff-display-bench",
    body: "--ff-body-bench",
    mono: "--ff-mono-bench",
  },
  {
    key: "grotesk",
    label: "Modern Grotesk",
    display: "--ff-display-grotesk",
    body: "--ff-body-grotesk",
    mono: "--ff-mono-grotesk",
  },
  {
    key: "slab",
    label: "Editorial Slab",
    display: "--ff-display-slab",
    body: "--ff-body-slab",
    mono: "--ff-mono-slab",
  },
];

export const DEFAULT_FONT_PAIRING = "bench";

export function getFontPairing(key: string): FontPairing {
  return (
    FONT_PAIRINGS.find((p) => p.key === key) ??
    FONT_PAIRINGS.find((p) => p.key === DEFAULT_FONT_PAIRING)!
  );
}
