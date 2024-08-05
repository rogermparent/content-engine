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
import IngredientInput from "./IngredientInput";
import clsx from "clsx";
import { useRef } from "react";

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
  const [{ values }, dispatch] = useKeyList<Ingredient>(defaultValue);
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
                  name={`${itemKey}.ingredient`}
                  defaultValue={defaultValue?.ingredient}
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
            dispatch({ type: "APPEND" });
          }}
        >
          Append
        </Button>
      </div>
    </FieldWrapper>
  );
}
