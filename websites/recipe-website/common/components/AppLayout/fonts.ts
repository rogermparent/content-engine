import {
  Archivo,
  Public_Sans,
  Spline_Sans_Mono,
  Space_Grotesk,
  Inter,
  JetBrains_Mono,
  Bitter,
  Source_Sans_3,
  IBM_Plex_Mono,
} from "next/font/google";

/*
 * The pre-registered font menu. next/font runs at build time, so every pairing a
 * theme can select must be loaded here; the theming engine only *switches* among
 * them by pointing the --ff-display/-body/-mono roles at a pairing's suffixed
 * vars (see packages/component-library/theming/fonts.ts + derive.ts). The
 * variable names below must match FONT_PAIRINGS exactly.
 *
 * Roles: display = condensed grotesque (headings & labels); body = humanist sans
 * (prose & instructions); mono = tabular-figure mono (quantities/durations/
 * timeline times). The "bench" pairing is the Working Bench default; the base
 * binding in styles/theme.css points the roles at it so the no-theme path works.
 */

// --- bench (default): Archivo / Public Sans / Spline Sans Mono ---
const benchDisplay = Archivo({
  subsets: ["latin"],
  variable: "--ff-display-bench",
  weight: ["500", "600", "700"],
  display: "swap",
});
const benchBody = Public_Sans({
  subsets: ["latin"],
  variable: "--ff-body-bench",
  display: "swap",
});
const benchMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--ff-mono-bench",
  display: "swap",
});

// --- grotesk: Space Grotesk / Inter / JetBrains Mono ---
const groteskDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--ff-display-grotesk",
  weight: ["500", "600", "700"],
  display: "swap",
});
const groteskBody = Inter({
  subsets: ["latin"],
  variable: "--ff-body-grotesk",
  display: "swap",
});
const groteskMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--ff-mono-grotesk",
  display: "swap",
});

// --- slab: Bitter / Source Sans 3 / IBM Plex Mono ---
const slabDisplay = Bitter({
  subsets: ["latin"],
  variable: "--ff-display-slab",
  weight: ["500", "600", "700"],
  display: "swap",
});
const slabBody = Source_Sans_3({
  subsets: ["latin"],
  variable: "--ff-body-slab",
  display: "swap",
});
const slabMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--ff-mono-slab",
  weight: ["400", "500"],
  display: "swap",
});

/** Class list applying every pairing's font variables; put on the <html>. */
export const fontVariables = [
  benchDisplay.variable,
  benchBody.variable,
  benchMono.variable,
  groteskDisplay.variable,
  groteskBody.variable,
  groteskMono.variable,
  slabDisplay.variable,
  slabBody.variable,
  slabMono.variable,
].join(" ");
