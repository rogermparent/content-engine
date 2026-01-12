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
  KeyListAction,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { ActionDispatch, useEffect, useState } from "react";
import { DummyMultiplyable, RecipeCustomControls } from "../RecipeMarkdown";
import StyledMarkdown from "component-library/components/Markdown";
import { PasteField } from "../PasteField";
import { HeadingListItemContainer } from "../HeadingListItemContainer";

function IngredientInput({
  name,
  defaultValue,
  defaultIsHeading,
  dispatch,
  index,
}: {
  name: string;
  defaultValue?: string;
  defaultIsHeading: boolean;
  index: number;
  dispatch: ActionDispatch<[KeyListAction<Ingredient>]>;
}) {
  const [isHeading, setIsHeading] = useState(defaultIsHeading);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [value, setValue] = useState<string>(defaultValue || "");

  return (
    <HeadingListItemContainer
      isHeading={isHeading}
      onToggleHeading={() => setIsHeading(!isHeading)}
      itemLabel="Ingredient"
      index={index}
      dispatch={dispatch}
      name={name}
    >
      <div className="flex flex-col border rounded-xs">
        <div className="flex gap-2 border-b p-2">
          <RecipeCustomControls textArea={input} />
        </div>
        <input
          name={`${name}.ingredient`}
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
    </HeadingListItemContainer>
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
  }, [defaultValue, dispatch]);

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
