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

// Modify IngredientInput to handle heading toggle
function IngredientInput({
  name,
  id,
  label,
  defaultValue,
  defaultIsHeading,
  errors,
}: MarkdownInputProps & {
  defaultIsHeading: boolean;
}) {
  const [isHeading, setIsHeading] = useState<boolean>(defaultIsHeading);
  return (
    <div className={clsx("relative rounded", isHeading && "bg-gray-100")}>
      <InlineMarkdownInput
        name={`${name}.ingredient`}
        id={id}
        label={label}
        defaultValue={defaultValue}
        errors={errors}
        Controls={RecipeCustomControls}
        components={{ Multiplyable: DummyMultiplyable }}
      />
      <button
        type="button"
        onClick={() => {
          setIsHeading((isHeading) => !isHeading);
        }}
        className="absolute top-0 right-0 m-2 text-blue-400 hover:text-blue-500"
      >
        {isHeading ? "Unset Heading" : "Set Heading"}
      </button>
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
              <div>
                <IngredientInput
                  name={itemKey}
                  defaultValue={defaultValue?.ingredient}
                  defaultIsHeading={defaultValue?.type === "heading"}
                />
              </div>
              <div className="flex flex-row flex-nowrap justify-center">
                <InputListControls dispatch={dispatch} index={index} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="my-1 flex flex-row">
        <Button
          onClick={() => {
            dispatch({
              type: "APPEND",
            });
          }}
        >
          Add Heading
        </Button>
        <Button onClick={() => dispatch({ type: "APPEND" })} className="ml-2">
          Append Ingredient
        </Button>
      </div>
    </FieldWrapper>
  );
}
