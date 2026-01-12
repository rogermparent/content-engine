import { RecipeFormErrors } from "../../../controller/formState";
import {
  Instruction,
  InstructionEntry,
  InstructionHeading,
} from "../../../controller/types";
import { Button } from "component-library/components/Button";
import { FieldWrapper } from "component-library/components/Form";
import {
  KeyListAction,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { NumberInput } from "component-library/components/Form/inputs/Number";
import InstructionTextInput from "./InstructionTextInput";
import { ActionDispatch, useEffect, useState } from "react";
import { PasteField } from "../PasteField";
import { HeadingListItemContainer } from "../HeadingListItemContainer";

function entryIsHeading(entry: InstructionEntry | undefined): boolean {
  return Boolean(entry && "type" in entry && entry.type === "heading");
}

function InstructionEntryInput<T>({
  defaultValue,
  itemKey,
  index,
  dispatch,
}: {
  defaultValue?: InstructionEntry;
  itemKey: string;
  index: number;
  dispatch: ActionDispatch<[action: KeyListAction<T>]>;
}) {
  const [isHeading, setIsHeading] = useState(entryIsHeading(defaultValue));
  useEffect(() => {
    setIsHeading(entryIsHeading(defaultValue));
  }, [defaultValue]);

  const instructionDefault = defaultValue as Instruction | undefined;
  const headingDefault = defaultValue as InstructionHeading | undefined;

  return (
    <li className="flex flex-col my-1">
      <HeadingListItemContainer
        isHeading={isHeading}
        onToggleHeading={() => setIsHeading((prev) => !prev)}
        itemLabel="Instruction"
        index={index}
        dispatch={dispatch}
        name={itemKey}
      >
        <TextInput
          label="Name"
          name={`${itemKey}.name`}
          defaultValue={isHeading ? headingDefault?.name : instructionDefault?.name}
          key={`${isHeading}-name-${defaultValue && "name" in defaultValue ? defaultValue.name : ""}`}
        />
        {isHeading ? (
          <NumberInput
            min={0}
            max={4}
            label="Level"
            name={`${itemKey}.level`}
            defaultValue={String(headingDefault?.level)}
            key={headingDefault?.level}
          />
        ) : (
          <InstructionTextInput
            label="Text"
            name={`${itemKey}.text`}
            defaultValue={instructionDefault?.text}
            key={instructionDefault?.text}
          />
        )}
      </HeadingListItemContainer>
    </li>
  );
}

const trimInstructionRegex = /^\s*(?:\d+[.:]?\s*)?(.*)/;

function parseInstructions(value: string): InstructionEntry[] {
  const lines = value.split(/\n+/);
  const instructions: InstructionEntry[] = [];
  for (const instruction of lines) {
    const trimmedInstruction = (
      trimInstructionRegex.exec(instruction)?.[1] || instruction
    ).trim();
    if (trimmedInstruction) {
      instructions.push({ text: trimmedInstruction });
    }
  }
  return instructions;
}

export function InstructionsListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: InstructionEntry[];
  placeholder?: string;
  errors?: RecipeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<InstructionEntry>(defaultValue);
  useEffect(() => {
    dispatch({ type: "RESET", values: defaultValue || [] });
  }, [defaultValue]);

  return (
    <FieldWrapper label={label} id={id}>
      <PasteField
        itemName="Instructions"
        pasteAreaId="instructions-paste-area"
        parseFunction={parseInstructions}
        onImport={(values) => dispatch({ type: "RESET", values })}
      />
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemKey = `${name}[${index}]`;
          return (
            <InstructionEntryInput
              key={key}
              defaultValue={defaultValue}
              itemKey={itemKey}
              index={index}
              dispatch={dispatch}
            />
          );
        })}
      </ul>
      <Button
        className="mx-0.5 my-1 w-full"
        onClick={() => {
          dispatch({ type: "APPEND" });
        }}
      >
        Add Instruction
      </Button>
    </FieldWrapper>
  );
}
