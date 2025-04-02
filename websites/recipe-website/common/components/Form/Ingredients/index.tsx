import clsx from "clsx";
import { RecipeFormErrors } from "../../../controller/formState";
import { Ingredient } from "../../../controller/types";
import { createIngredients } from "../../../util/parseIngredients";
import { Button } from "component-library/components/Button";
import {
  FieldWrapper,
  baseInputStyle,
} from "component-library/components/Form";
import {
  InputListControls,
  KeyListAction,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { ActionDispatch, useRef, useState } from "react";
import { InlineMarkdownInput } from "component-library/components/Form/inputs/Markdown/Inline";
import { MarkdownInputProps } from "component-library/components/Form/inputs/Markdown/common";
import { DummyMultiplyable, RecipeCustomControls } from "../RecipeMarkdown";

function IngredientInput({
  name,
  id,
  label,
  defaultValue,
  defaultIsHeading,
  errors,
  dispatch,
  index,
}: MarkdownInputProps & {
  defaultIsHeading: boolean;
  index: number;
  dispatch: ActionDispatch<[KeyListAction<Ingredient>]>;
}) {
  const [isHeading, setIsHeading] = useState(defaultIsHeading);

  return (
    <div
      className={clsx(
        "transition p-2 rounded-xs border mb-2",
        isHeading
          ? "bg-slate-800 border-slate-600"
          : "bg-slate-950 border-slate-700",
      )}
    >
      <InlineMarkdownInput
        name={`${name}.ingredient`}
        id={id}
        label={label}
        defaultValue={defaultValue}
        errors={errors}
        Controls={RecipeCustomControls}
        components={{ Multiplyable: DummyMultiplyable }}
      />
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
        <button
          type="button"
          onClick={() => {
            setIsHeading(!isHeading);
          }}
          className={clsx(
            "text-xs text-slate-400 hover:text-slate-300 p-2",
            isHeading ? "text-slate-500" : "text-slate-300",
          )}
        >
          {isHeading ? "Heading" : "Ingredient"}
        </button>
      </div>
      {isHeading && (
        <input type="hidden" name={`${name}.type`} value="heading" />
      )}
    </div>
  );
}

export function IngredientsListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: Ingredient[];
  placeholder?: string;
  errors?: RecipeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<Ingredient>(defaultValue || []);

  const importTextareaRef = useRef<HTMLTextAreaElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const ingredientsPasteId = "ingredients-paste-area";

  return (
    <FieldWrapper label={label} id={id}>
      <details ref={detailsRef}>
        <summary>Paste Ingredients</summary>
        <textarea
          title="Ingredients Paste Area"
          id={ingredientsPasteId}
          ref={importTextareaRef}
          className={clsx(baseInputStyle, "w-full h-36")}
        />
        <div className="my-1 flex flex-row">
          <Button
            onClick={() => {
              const value = importTextareaRef.current?.value;
              dispatch({
                type: "RESET",
                values: value ? createIngredients(value) : [],
              });
              if (detailsRef.current) {
                detailsRef.current.open = false;
              }
            }}
          >
            Import Ingredients
          </Button>
        </div>
      </details>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemKey = `${name}[${index}]`;

          return (
            <li key={key} className="flex flex-col my-1">
              <IngredientInput
                name={itemKey}
                index={index}
                defaultValue={defaultValue?.ingredient}
                defaultIsHeading={defaultValue?.type === "heading"}
                dispatch={dispatch}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex flex-row">
        <Button onClick={() => dispatch({ type: "APPEND" })}>
          Add Ingredient
        </Button>
      </div>
    </FieldWrapper>
  );
}
