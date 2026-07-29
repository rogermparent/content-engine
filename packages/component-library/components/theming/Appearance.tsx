"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import type { Preset } from "@discontent/component-library/theming";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@discontent/component-library/components/ui/popover";
import { ThemeToggle } from "@discontent/component-library/components/theming/ThemeToggle";
import { PresetPicker } from "@discontent/component-library/components/theming/PresetPicker";

/**
 * A labeled field with the house instrument-panel caption (mono, uppercase,
 * tabular) sitting above its control.
 */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        id={htmlFor}
        className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * The two appearance controls — color mode + palette preset — consolidated into
 * one labeled block. Shared verbatim between a site's desktop Appearance popover
 * and its mobile hamburger sheet so there's a single control pattern.
 *
 * `presets` threads through to {@link PresetPicker}: each site ships its own
 * curated list, and the key has to resolve against the same list that was
 * rendered. Omit it for the built-ins.
 */
export function AppearanceControls({ presets }: { presets?: Preset[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Theme">
        <ThemeToggle />
      </Field>
      <Field label="Preset">
        <PresetPicker className="w-full" presets={presets} />
      </Field>
    </div>
  );
}

/**
 * Desktop Appearance control: a single ghost icon button that opens a popover
 * holding {@link AppearanceControls}. Replaces the empty-looking preset select
 * and the triple theme toggle that used to sit loose in the masthead.
 */
export function AppearanceMenu({
  className,
  presets,
}: {
  className?: string;
  presets?: Preset[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Appearance"
          className={className}
        >
          <SlidersHorizontalIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <AppearanceControls presets={presets} />
      </PopoverContent>
    </Popover>
  );
}
