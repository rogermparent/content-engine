import { Archivo, Public_Sans, Spline_Sans_Mono } from "next/font/google";

/*
 * Working Bench typefaces, exposed as CSS variables the design tokens map onto
 * (see packages/component-library/styles/theme.css):
 *   --ff-display  condensed grotesque, headings & labels
 *   --ff-body     humanist sans, prose & instructions
 *   --ff-mono     tabular-figure mono, quantities/durations/timeline times
 */

const display = Archivo({
  subsets: ["latin"],
  variable: "--ff-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Public_Sans({
  subsets: ["latin"],
  variable: "--ff-body",
  display: "swap",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--ff-mono",
  display: "swap",
});

/** Class list applying all three font variables; put on the <html> element. */
export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
