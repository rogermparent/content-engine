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
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { useRef, useState } from "react";
import { InlineMarkdownInput } from "component-library/components/Form/inputs/Markdown/Inline";
import { MarkdownInputProps } from "component-library/components/Form/inputs/Markdown/common";
import { DummyMultiplyable, RecipeCustomControls } from "../RecipeMarkdown";

function IngredientInput({
  name,
  index,
  defaultValue,
  defaultIsHeading,
  dispatch,
}: {
  name: string;
  index: number;
  defaultValue?: string;
  defaultIsHeading: boolean;
  dispatch: (action: { type: string; index?: number }) => void;
}) {
  const [isHeading, setIsHeading] = useState(defaultIsHeading);

  return (
    <div
      className={clsx(
        "transition p-2 rounded border mb-2",
        isHeading
          ? "bg-slate-800 border-slate-600"
          : "bg-slate-950 border-slate-700",
      )}
    >
      <InlineMarkdownInput
        name={`${name}.ingredient`}
        defaultValue={defaultValue}
        Controls={RecipeCustomControls}
        components={{ Multiplyable: DummyMultiplyable }}
      />
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
        <button
          type="button"
          onClick={() => {
            setIsHeading(!isHeading);
            if (!isHeading) {
              dispatch({
                type: "UPDATE",
                index: index,
                payload: {
                  [`${name}.type`]: "heading",
                },
              });
            } else {
              dispatch({
                type: "UPDATE",
                index: index,
                payload: {
                  [`${name}.type`]: undefined,
                },
              });
            }
          }}
          className={clsx(
            "text-xs text-slate-400 hover:text-slate-300",
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
  defaultValue,
}: {
  name: string;
  defaultValue?: Ingredient[];
}) {
  const [{ values }, dispatch] = useKeyList<Ingredient>(defaultValue || []);

  return (
    <FieldWrapper label="Ingredients" id="ingredients">
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
        <Button
          onClick={() =>
            dispatch({
              type: "APPEND",
              payload: { ingredient: "", type: "heading" },
            })
          }
          className="ml-2"
        >
          Add Heading
        </Button>
      </div>
    </FieldWrapper>
  );
}
