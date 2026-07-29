"use client";

import { useActionState } from "react";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";
import { TextAreaInput } from "@discontent/component-library/components/Form/inputs/TextArea";
import { Button } from "@discontent/component-library/components/ui/button";
import { POSTURE_OPTIONS } from "portfolio-website-common/config/site";
import type { Settings } from "@/settings";
import { SettingsCard } from "../SettingsCard";
import { updateSettings } from "./actions";

/**
 * Site identity plus the posture picker.
 *
 * The posture is the reason this page exists. `SITE_LAYOUT` was read-only, so
 * the three postures — the whole point of "one template, three audiences" —
 * could only be changed by editing the environment and rebuilding. A radio
 * group, not a `<select>`: there are three options, each needs a line of
 * explanation, and native radios submit through FormData without any JS.
 */
export function SiteDetailsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(updateSettings, null);
  const current = settings.posture ?? "index";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SettingsCard
        title="Site details"
        description="The wordmark, the description, and the statement above the index."
      >
        <div className="flex flex-col">
          <TextInput
            label="Title"
            name="title"
            id="settings-title"
            defaultValue={settings.title}
          />
          <TextInput
            label="Description"
            name="description"
            id="settings-description"
            defaultValue={settings.description}
          />
          <TextAreaInput
            label="Statement"
            name="statement"
            id="settings-statement"
            defaultValue={settings.statement}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Posture"
        description="Same works, same search — a different order and weight."
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Posture</legend>
          {POSTURE_OPTIONS.map(({ value, label, hint }) => (
            <div
              key={value}
              className="flex flex-row items-start gap-3 rounded-md border border-border p-3 has-[:checked]:border-primary"
            >
              <input
                type="radio"
                id={`posture-${value}`}
                name="posture"
                value={value}
                defaultChecked={current === value}
                aria-describedby={`posture-${value}-hint`}
                className="mt-1 size-4 accent-primary"
              />
              {/*
               * The hint is `aria-describedby`, not part of the label. Nesting
               * it inside <label> folds it into the radio's *accessible name* —
               * which made the Résumé option answer to `getByLabel("Statement")`
               * and collide with the Statement textarea above it.
               */}
              <span className="flex flex-col">
                <label
                  htmlFor={`posture-${value}`}
                  className="cursor-pointer text-sm font-medium"
                >
                  {label}
                </label>
                <span
                  id={`posture-${value}-hint`}
                  className="text-sm text-muted-foreground"
                >
                  {hint}
                </span>
              </span>
            </div>
          ))}
        </fieldset>
      </SettingsCard>

      <div className="flex flex-row items-center gap-3">
        <Button type="submit">Save</Button>
        {state && (
          <p
            role="status"
            className={`text-sm ${state.success ? "text-success" : "text-destructive"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
