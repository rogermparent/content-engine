"use client";

import clsx from "clsx";
import { Button } from "@discontent/component-library/components/Button";
import { Toggle } from "@discontent/component-library/components/ui/toggle";
import { FieldWrapper } from "@discontent/component-library/components/Form";
import { LexicalMarkdownInput } from "@discontent/component-library/components/Form/inputs/LexicalMarkdown";
import { RECIPE_MARKDOWN } from "@discontent/component-library/components/Form/inputs/LexicalMarkdown/transformers";
import { recipeToolbarItems } from "../RecipeMarkdown/lexicalToolbar";
import { PasteField, ParsedLine } from "../PasteField";
import { createIngredient } from "../../../util/parseIngredients";
import { Ingredient } from "../../../controller/types";
import { useRecipeForm } from "../formContext";
import { ArrayItemControls } from "@discontent/component-library/components/Form/ArrayItemControls";

/**
 * Reorder / insert / delete controls for an array item, driven by TanStack
 * Form array-field helpers (replacing the old useKeyList dispatch).
 */
function IngredientInput({
  index,
  onInsert,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  onInsert: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const form = useRecipeForm();

  return (
    <form.Field name={`ingredients[${index}].type`}>
      {(typeField) => {
        const isHeading = typeField.state.value === "heading";
        return (
          <div
            className={clsx(
              "transition p-2 rounded-xs border mb-2",
              isHeading
                ? "bg-card border-border"
                : "bg-background border-border",
            )}
            aria-label={`Ingredient ${index + 1} Container`}
          >
            <form.Field name={`ingredients[${index}].ingredient`}>
              {(field) => (
                <LexicalMarkdownInput
                  dialect={RECIPE_MARKDOWN}
                  name={`ingredients[${index}].ingredient`}
                  id={`recipe-form-ingredients[${index}].ingredient`}
                  label={`Ingredient ${index + 1}`}
                  value={field.state.value ?? ""}
                  onChange={field.handleChange}
                  toolbarItems={recipeToolbarItems}
                  compact
                />
              )}
            </form.Field>
            <div className="flex flex-row flex-nowrap justify-center">
              <ArrayItemControls
                onInsert={onInsert}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onRemove={onRemove}
              />
              <Toggle
                size="sm"
                pressed={isHeading}
                onPressedChange={(pressed) =>
                  typeField.handleChange(pressed ? "heading" : undefined)
                }
                aria-label={`Toggle Ingredient ${index + 1} Type`}
                className="text-xs"
              >
                {isHeading ? "Heading" : "Ingredient"}
              </Toggle>
            </div>
            {isHeading && (
              <input
                type="hidden"
                name={`ingredients[${index}].type`}
                value="heading"
              />
            )}
          </div>
        );
      }}
    </form.Field>
  );
}

/**
 * Derive the reviewable line model from a raw ingredient paste, reusing
 * `createIngredient` for the number/fraction cleanup and heading detection.
 * Blank lines are dropped (createIngredient returns undefined for them).
 */
function parseIngredientLines(value: string): ParsedLine[] {
  return value
    .split(/\n+/)
    .map(createIngredient)
    .filter((ing): ing is Ingredient => Boolean(ing))
    .map((ing) => ({
      text: ing.ingredient,
      isHeading: ing.type === "heading",
    }));
}

/**
 * Fold reviewed lines back into flat ingredients. Ingredient headings stay flat
 * (`type: "heading"`) — no group nesting — matching the current model and view.
 * With no toggles this reproduces `createIngredients` exactly.
 */
function assembleIngredients(lines: ParsedLine[]): Ingredient[] {
  return lines.map((line) => ({
    ingredient: line.text,
    ...(line.isHeading && { type: "heading" as const }),
  }));
}

export function IngredientsListInput({
  label,
  id = "recipe-form-ingredients",
}: {
  name?: string;
  id?: string;
  label: string;
  defaultValue?: Ingredient[];
  placeholder?: string;
  errors?: unknown;
}) {
  const form = useRecipeForm();

  return (
    <FieldWrapper label={label} id={id}>
      <form.Field name="ingredients" mode="array">
        {(arrayField) => {
          const items = arrayField.state.value ?? [];
          return (
            <>
              <PasteField
                itemName="Ingredients"
                pasteAreaId="ingredients-paste-area"
                parseToLines={parseIngredientLines}
                assemble={assembleIngredients}
                onImport={(values) =>
                  form.setFieldValue("ingredients", values as Ingredient[])
                }
              />
              <ul>
                {items.map((_, index) => (
                  <li key={index} className="flex flex-col my-1">
                    <IngredientInput
                      index={index}
                      onInsert={() =>
                        arrayField.insertValue(index, { ingredient: "" })
                      }
                      onMoveUp={() =>
                        index > 0 && arrayField.moveValue(index, index - 1)
                      }
                      onMoveDown={() =>
                        index < items.length - 1 &&
                        arrayField.moveValue(index, index + 1)
                      }
                      onRemove={() => arrayField.removeValue(index)}
                    />
                  </li>
                ))}
              </ul>
              <div className="flex flex-row">
                <Button
                  onClick={() => arrayField.pushValue({ ingredient: "" })}
                >
                  Add Ingredient
                </Button>
              </div>
            </>
          );
        }}
      </form.Field>
    </FieldWrapper>
  );
}
