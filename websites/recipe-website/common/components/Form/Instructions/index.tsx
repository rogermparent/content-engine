import { RecipeFormErrors } from "../../../controller/formState";
import {
  Instruction,
  InstructionEntry,
  InstructionHeading,
} from "../../../controller/types";
import { Button } from "component-library/components/Button";
import { FieldWrapper } from "component-library/components/Form";
import {
  InputListControls,
  KeyListAction,
  ListInputButton,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { NumberInput } from "component-library/components/Form/inputs/Number";
import InstructionTextInput from "./InstructionTextInput";
import { ActionDispatch, useEffect, useState } from "react";
import { PasteField } from "../PasteField";

function InstructionInput({
  currentDefaultItem,
  itemKey,
}: {
  currentDefaultItem?: Instruction;
  itemKey: string;
}) {
  return (
    <div>
      <TextInput
        label="Name"
        name={`${itemKey}.name`}
        defaultValue={currentDefaultItem?.name}
        key={currentDefaultItem?.name}
      />
      <InstructionTextInput
        label="Text"
        name={`${itemKey}.text`}
        defaultValue={currentDefaultItem?.text}
        key={currentDefaultItem?.text}
      />
    </div>
  );
}

function InstructionHeadingInput({
  currentDefaultItem,
  itemKey,
}: {
  currentDefaultItem?: InstructionHeading;
  itemKey: string;
}) {
  return (
    <div>
      <TextInput
        label="Name"
        name={`${itemKey}.name`}
        defaultValue={currentDefaultItem?.name}
        key={currentDefaultItem?.name}
      />
      <NumberInput
        min={0}
        max={4}
        label="Level"
        name={`${itemKey}.level`}
        defaultValue={String(currentDefaultItem?.level)}
        key={currentDefaultItem?.level}
      />
    </div>
  );
}

function entryIsHeading(entry: InstructionEntry | undefined): boolean {
  return Boolean(entry && "instructions" in entry && entry.instructions);
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

  const toggleIsHeading = () => {
    setIsHeading((prevIsHeading) => !prevIsHeading);
  };

  return (
    <li className="flex flex-col my-1">
      {isHeading ? (
        <InstructionHeadingInput
          currentDefaultItem={defaultValue as InstructionHeading}
          itemKey={itemKey}
        />
      ) : (
        <InstructionInput
          currentDefaultItem={defaultValue as Instruction}
          itemKey={itemKey}
        />
      )}
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
        <ListInputButton onClick={toggleIsHeading}>
          {isHeading ? <>&#8213;</> : <>&#9776;</>}
        </ListInputButton>
      </div>
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
