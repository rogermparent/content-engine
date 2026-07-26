"use client";

import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import { Badge } from "@discontent/component-library/components/ui/badge";
import {
  FieldWrapper,
  baseInputStyle,
} from "@discontent/component-library/components/Form";
import { normalizeTag } from "../../../controller/normalizeTags";
import { useRecipeForm } from "../formContext";

/**
 * Free-form tag chips backed by the TanStack array-field pattern
 * (`form.Field name="tags" mode="array"`), mirroring Ingredients. Typing a tag
 * and pressing Enter or comma commits it as a removable Badge chip; each chip
 * submits via a hidden `tags[i]` input (FormData bracket-notation round-trips
 * to a string array before zod). Existing corpus tags not yet selected show as
 * one-click quick-add suggestions.
 */
export function TagsInput({
  label = "Tags",
  id = "recipe-form-tags",
  allTags = [],
}: {
  label?: string;
  id?: string;
  allTags?: string[];
}) {
  const form = useRecipeForm();
  const [draft, setDraft] = useState("");

  return (
    <FieldWrapper label={label} id={id}>
      <form.Field name="tags" mode="array">
        {(arrayField) => {
          const items = arrayField.state.value ?? [];

          const commit = (raw: string) => {
            const tag = normalizeTag(raw);
            if (tag && !items.includes(tag)) {
              arrayField.pushValue(tag);
            }
            setDraft("");
          };

          const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && items.length > 0) {
              arrayField.removeValue(items.length - 1);
            }
          };

          const suggestions = allTags.filter((tag) => !items.includes(tag));

          return (
            <>
              <div
                className="flex flex-row flex-wrap items-center gap-1.5"
                aria-label="Selected tags"
              >
                {items.map((tag, index) => (
                  // Hidden input submits the tag; the chip carries a remove button.
                  <Badge key={`${tag}-${index}`} variant="secondary">
                    <input type="hidden" name={`tags[${index}]`} value={tag} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => arrayField.removeValue(index)}
                      aria-label={`Remove tag ${tag}`}
                      className="ml-0.5 rounded-full outline-none focus-visible:ring-ring/50 focus-visible:ring-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <input
                  id={id}
                  aria-label="Add a tag"
                  className={clsx(
                    baseInputStyle,
                    "py-1 px-2 h-8 grow min-w-32",
                  )}
                  value={draft}
                  placeholder="Add a tag…"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={() => draft && commit(draft)}
                />
              </div>
              {suggestions.length > 0 && (
                <div
                  className="flex flex-row flex-wrap items-center gap-1.5 mt-1.5"
                  aria-label="Tag suggestions"
                >
                  {suggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => commit(tag)}
                      aria-label={`Add tag ${tag}`}
                      className="rounded-md focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      >
                        + {tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        }}
      </form.Field>
    </FieldWrapper>
  );
}
