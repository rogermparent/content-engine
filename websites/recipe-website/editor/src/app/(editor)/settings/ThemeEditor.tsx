"use client";

import { useActionState, useMemo, useState } from "react";
import {
  PRESETS,
  WORKING_BENCH,
  FONT_PAIRINGS,
  getPreset,
  type Theme,
  type NeutralKey,
  type ColorMode,
} from "@discontent/component-library/theming";
import {
  FieldWrapper,
  Label,
} from "@discontent/component-library/components/Form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@discontent/component-library/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@discontent/component-library/components/ui/toggle-group";
import { Slider } from "@discontent/component-library/components/ui/slider";
import { AccentPicker } from "@discontent/component-library/components/theming/AccentPicker";
import { Button } from "@discontent/component-library/components/ui/button";
import { Badge } from "@discontent/component-library/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@discontent/component-library/components/ui/card";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useThemeVars } from "recipe-website-common/components/AppLayout/ThemeVarsProvider";
import { updateSettings } from "./actions";

const NEUTRALS: { value: NeutralKey; label: string }[] = [
  { value: "warm", label: "Warm paper" },
  { value: "cool", label: "Cool slate" },
  { value: "gray", label: "Neutral gray" },
];

const MODES: { value: ColorMode; label: string; Icon: typeof SunIcon }[] = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

/** The live-preview cluster — real primitives so token edits show immediately. */
function ThemePreview() {
  return (
    <Card data-testid="theme-preview" className="w-full max-w-sm gap-4 py-4">
      <CardHeader>
        <CardTitle className="font-display">Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          The quick brown fox jumps over the lazy dog.{" "}
          <span className="font-mono tabular-nums">1½ cups · 45 min</span>
        </p>
        <div className="flex flex-row flex-wrap gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
        </div>
        <div className="flex flex-row flex-wrap gap-2">
          <Badge>Featured</Badge>
          <Badge variant="secondary">30 min</Badge>
          <Badge variant="outline">Vegetarian</Badge>
        </div>
        <div className="bg-muted text-muted-foreground rounded-md p-2 text-xs">
          Muted surface — subtitles, hints, and secondary detail.
        </div>
      </CardContent>
    </Card>
  );
}

export function ThemeEditor({ theme: siteTheme }: { theme?: Theme }) {
  const { previewTheme } = useThemeVars();
  const [state, formAction] = useActionState(updateSettings, null);
  const [theme, setTheme] = useState<Theme>(siteTheme ?? WORKING_BENCH);

  const serialized = useMemo(() => JSON.stringify(theme), [theme]);

  // Update a knob, re-render, and preview it live across the whole UI.
  function update(patch: Partial<Theme>) {
    const next = { ...theme, ...patch };
    setTheme(next);
    previewTheme(next);
  }

  function applyPreset(key: string) {
    const next = { ...getPreset(key).theme };
    setTheme(next);
    previewTheme(next);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
        <input type="hidden" name="theme" value={serialized} />

        <FieldWrapper label="Start from a preset">
          <Select onValueChange={applyPreset}>
            <SelectTrigger aria-label="Preset" className="w-full">
              <SelectValue placeholder="Choose a preset…" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper label="Accent">
          <AccentPicker
            value={theme.accentHue}
            onChange={(hue) => update({ accentHue: hue })}
          />
        </FieldWrapper>

        <FieldWrapper label="Neutral">
          <Select
            value={theme.neutral}
            onValueChange={(v) => update({ neutral: v as NeutralKey })}
          >
            <SelectTrigger aria-label="Neutral" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NEUTRALS.map((n) => (
                <SelectItem key={n.value} value={n.value}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper label="Corner radius">
          <div className="flex flex-row items-center gap-3">
            <Slider
              aria-label="Corner radius"
              min={0}
              max={1.5}
              step={0.05}
              value={[theme.radius]}
              onValueChange={([r]) => update({ radius: r })}
              className="max-w-xs"
            />
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {theme.radius.toFixed(2)}rem
            </span>
          </div>
        </FieldWrapper>

        <FieldWrapper label="Typeface pairing">
          <Select
            value={theme.fontPairing}
            onValueChange={(v) => update({ fontPairing: v })}
          >
            <SelectTrigger aria-label="Typeface pairing" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_PAIRINGS.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper label="Default color mode">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={theme.defaultMode ?? "system"}
            onValueChange={(v) => v && update({ defaultMode: v as ColorMode })}
            aria-label="Default color mode"
          >
            {MODES.map(({ value, label, Icon }) => (
              <ToggleGroupItem key={value} value={value} aria-label={label}>
                <Icon className="size-4" />
                <span className="ml-1 text-xs">{label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldWrapper>

        {state && (
          <div
            role="status"
            className={`text-sm ${state.success ? "text-green-500" : "text-destructive"}`}
          >
            {state.message}
          </div>
        )}

        <div className="flex flex-row flex-wrap gap-2">
          <Button type="submit">Save as site default</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => applyPreset("working-bench")}
          >
            Reset to Working Bench
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <Label>Live preview</Label>
        <ThemePreview />
      </div>
    </div>
  );
}
