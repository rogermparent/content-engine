"use client";

import { useActionState } from "react";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";
import { SubmitButton } from "@discontent/component-library/components/SubmitButton";
import { updateSettings } from "./actions";
import { Settings } from "@/settings";

/** Contact fields, matching the footer's known ContactLinks keys (PR 13). */
const CONTACT_FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: "email", label: "Email", placeholder: "cook@example.com" },
  { key: "website", label: "Website URL", placeholder: "https://…" },
  { key: "instagram", label: "Instagram URL" },
  { key: "youtube", label: "YouTube URL" },
  { key: "twitter", label: "Twitter / X URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "github", label: "GitHub URL" },
];

/**
 * Edits the footer note + contact/social links (the PR 13 footer plumbing).
 * Posts to the shared `updateSettings`, which merge-preserves other fields.
 */
export function SiteDetailsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(updateSettings, null);
  return (
    <form action={formAction}>
      {state && (
        <div
          className={`py-1 text-sm ${
            state.success ? "text-primary" : "text-destructive"
          }`}
        >
          {state.message}
        </div>
      )}
      <TextInput
        label="Footer note"
        name="footerNote"
        defaultValue={settings.footerNote ?? ""}
        placeholder="e.g. Handwritten in a warm kitchen."
      />
      <p className="mx-2 mt-1 text-xs text-muted-foreground">
        Shown in the footer colophon next to the copyright.
      </p>
      <fieldset className="mt-4">
        <legend className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Contact &amp; social links
        </legend>
        <p className="mx-2 mt-1 mb-2 text-xs text-muted-foreground">
          Each filled link shows as an icon in the footer. Leave blank to hide.
        </p>
        {CONTACT_FIELDS.map((field) => (
          <TextInput
            key={field.key}
            label={field.label}
            name={`contact.${field.key}`}
            defaultValue={
              settings.contact?.[field.key as keyof typeof settings.contact] ??
              ""
            }
            placeholder={field.placeholder}
          />
        ))}
      </fieldset>
      <div className="my-1 flex flex-row flex-nowrap gap-1">
        <SubmitButton>Save</SubmitButton>
      </div>
    </form>
  );
}
