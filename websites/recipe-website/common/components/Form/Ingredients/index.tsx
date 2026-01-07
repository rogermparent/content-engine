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
import { ActionDispatch, useEffect, useState } from "react";
import { MarkdownInputProps } from "component-library/components/Form/inputs/Markdown/common";
import { DummyMultiplyable, RecipeCustomControls } from "../RecipeMarkdown";
import StyledMarkdown from "component-library/components/Markdown";
import { PasteField } from "../PasteField";

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
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [value, setValue] = useState<string>(defaultValue || "");

  return (
    <div
      className={clsx(
        "transition p-2 rounded-xs border mb-2",
        isHeading
          ? "bg-slate-800 border-slate-600"
          : "bg-slate-950 border-slate-700",
      )}
      aria-label={`Ingredient ${index + 1} Container`}
    >
      <div className="flex flex-col border rounded-xs">
        <div className="flex gap-2 border-b p-2">
          <RecipeCustomControls textArea={input} />
        </div>
        <input
          name={`${name}.ingredient`}
          id={id}
          aria-label={`Ingredient ${index + 1}`}
          ref={(el) => {
            setInput(el);
          }}
          className={clsx(baseInputStyle, "py-1 px-2 grow w-full h-8")}
          defaultValue={defaultValue}
          onChange={(e) => setValue(e.target.value)}
        />
        <div
          className="py-1 px-2 markdown-body min-h-8 border-t"
          aria-label={`Ingredient ${index + 1} Preview`}
        >
          <StyledMarkdown components={{ Multiplyable: DummyMultiplyable }}>
            {value}
          </StyledMarkdown>
        </div>
      </div>
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
        <button
          type="button"
          onClick={() => {
            setIsHeading(!isHeading);
          }}
          aria-label={`Toggle Ingredient ${index + 1} Type`}
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
  useEffect(() => {
    dispatch({ type: "RESET", values: defaultValue || [] });
  }, [defaultValue]);

  return (
    <FieldWrapper label={label} id={id}>
      <PasteField
        itemName="Ingredients"
        pasteAreaId="ingredients-paste-area"
        parseFunction={createIngredients}
        onImport={(values) => dispatch({ type: "RESET", values })}
      />
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
