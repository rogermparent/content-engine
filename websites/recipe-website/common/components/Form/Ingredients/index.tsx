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
  defaultValue,
  onChange,
  isHeading,
  onToggleHeading,
}: {
  name: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  isHeading: boolean;
  onToggleHeading: () => void;
}) {
  return (
    <div className={clsx("relative", isHeading && "bg-gray-100 p-2 rounded")}>
      <InlineMarkdownInput
        name={name}
        defaultValue={defaultValue}
        onChange={onChange}
        Controls={RecipeCustomControls}
        components={{ Multiplyable: DummyMultiplyable }}
      />
      <button
        onClick={onToggleHeading}
        className={clsx(
          "absolute top-0 right-0 m-2",
          isHeading ? "text-blue-500" : "text-gray-500 hover:text-blue-500",
        )}
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
}) {
  const [{ values }, dispatch] = useKeyList<Ingredient>(defaultValue || []);
  const [isHeading, setIsHeading] = useState<boolean>(false);

  const handleToggleHeading = (index: number) => {
    dispatch({
      type: "UPDATE",
      index,
      value: {
        ...values[index],
        type: values[index].type === "heading" ? undefined : "heading",
      },
    });
  };

  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemKey = `${name}[${index}]`;
          const itemIsHeading = defaultValue?.type === "heading";

          return (
            <li key={key} className="flex flex-col my-1">
              <div>
                <IngredientInput
                  name={`${itemKey}.ingredient`}
                  defaultValue={defaultValue?.ingredient}
                  isHeading={itemIsHeading}
                  onToggleHeading={() => handleToggleHeading(index)}
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
              value: { ingredient: "", type: "heading" },
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
