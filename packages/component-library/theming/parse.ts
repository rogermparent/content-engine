/*
 * Validate untrusted theme JSON (from a form field or localStorage) into a
 * well-formed Theme, clamping/normalizing every knob. Never throws — returns
 * null when the input isn't usable so callers can fall back to the default.
 */

import { normalizeHue } from "./derive";
import { getFontPairing } from "./fonts";
import type { ColorMode, NeutralKey, Theme } from "./types";

const NEUTRALS: NeutralKey[] = ["warm", "cool", "gray"];
const MODES: ColorMode[] = ["system", "light", "dark"];

const MIN_RADIUS = 0;
const MAX_RADIUS = 2;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Parse a raw value (object or JSON string) into a validated Theme, or null. */
export function parseTheme(input: unknown): Theme | null {
  let obj: unknown = input;
  if (typeof input === "string") {
    try {
      obj = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const r = obj as Record<string, unknown>;

  const accentHue =
    typeof r.accentHue === "number" && Number.isFinite(r.accentHue)
      ? normalizeHue(r.accentHue)
      : null;
  const radius =
    typeof r.radius === "number" && Number.isFinite(r.radius)
      ? clamp(r.radius, MIN_RADIUS, MAX_RADIUS)
      : null;
  const neutral =
    typeof r.neutral === "string" && NEUTRALS.includes(r.neutral as NeutralKey)
      ? (r.neutral as NeutralKey)
      : null;
  if (accentHue === null || radius === null || neutral === null) return null;

  // Coerce an unknown pairing back to a valid key rather than rejecting.
  const fontPairing =
    typeof r.fontPairing === "string"
      ? getFontPairing(r.fontPairing).key
      : getFontPairing("").key;

  const defaultMode =
    typeof r.defaultMode === "string" &&
    MODES.includes(r.defaultMode as ColorMode)
      ? (r.defaultMode as ColorMode)
      : undefined;

  return { accentHue, neutral, radius, fontPairing, defaultMode };
}
