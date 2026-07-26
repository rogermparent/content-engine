"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@discontent/component-library/components/ui/popover";
import { ThemeToggle } from "./ThemeToggle";
import { PresetPicker } from "./PresetPicker";

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
 * one labeled block (PR 9). Shared verbatim between the desktop Appearance
 * popover and the mobile hamburger sheet so there's a single control pattern.
 */
export function AppearanceControls() {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Theme">
        <ThemeToggle />
      </Field>
      <Field label="Preset">
        <PresetPicker className="w-full" />
      </Field>
    </div>
  );
}

/**
 * Desktop Appearance control: a single ghost icon button that opens a popover
 * holding {@link AppearanceControls}. Replaces the empty-looking preset select
 * and the triple theme toggle that used to sit loose in the masthead.
 */
export function AppearanceMenu({ className }: { className?: string }) {
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
        <AppearanceControls />
      </PopoverContent>
    </Popover>
  );
}
