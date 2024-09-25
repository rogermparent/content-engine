import { RecipeFormErrors } from "../../../controller/formState";
import {
  Instruction,
  InstructionEntry,
  InstructionGroup,
} from "../../../controller/types";
import { Button } from "component-library/components/Button";
import {
  FieldWrapper,
  baseInputStyle,
} from "component-library/components/Form";
import {
  InputListControls,
  KeyListAction,
  ListInputButton,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { TextInput } from "component-library/components/Form/inputs/Text";
import InstructionTextInput from "./InstructionTextInput";
import clsx from "clsx";
import { ActionDispatch, useEffect, useRef, useState } from "react";

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

function InstructionGroupInput<T>({
  currentDefaultItem,
  itemKey,
}: {
  currentDefaultItem?: InstructionGroup;
  itemKey: string;
  index: number;
  dispatch: ActionDispatch<[action: KeyListAction<T>]>;
}) {
  const [{ values }, childDispatch] = useKeyList<InstructionEntry>(
    currentDefaultItem?.instructions,
  );
  return (
    <div>
      <TextInput
        label="Name"
        name={`${itemKey}.name`}
        defaultValue={currentDefaultItem?.name}
      />
      <FieldWrapper label="Children">
        <div className="pl-2 ml-0.5 border-l-2 border-white">
          <ul>
            {values.map(({ key, defaultValue }, index) => {
              const childItemKey = `${itemKey}.instructions[${index}]`;
              return (
                <li key={key}>
                  <InstructionInput
                    currentDefaultItem={defaultValue as Instruction}
                    itemKey={childItemKey}
                  />
                  <div className="flex flex-row flex-nowrap justify-center">
                    <InputListControls dispatch={childDispatch} index={index} />
                  </div>
                </li>
              );
            })}
          </ul>
          <Button
            className="mx-0.5 my-1 w-full"
            onClick={() => {
              childDispatch({ type: "APPEND" });
            }}
          >
            Add Instruction
          </Button>
        </div>
      </FieldWrapper>
    </div>
  );
}

function entryIsGroup(entry: InstructionEntry | undefined): boolean {
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
  const [isGroup, setIsGroup] = useState(entryIsGroup(defaultValue));
  useEffect(() => {
    setIsGroup(entryIsGroup(defaultValue));
  }, [defaultValue]);

  const toggleIsGroup = () => {
    setIsGroup((prevIsGroup) => !prevIsGroup);
  };

  return (
    <li className="flex flex-col my-1">
      {isGroup ? (
        <InstructionGroupInput
          currentDefaultItem={defaultValue as InstructionGroup}
          itemKey={itemKey}
          dispatch={dispatch}
          index={index}
        />
      ) : (
        <InstructionInput
          currentDefaultItem={defaultValue as Instruction}
          itemKey={itemKey}
        />
      )}
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
        <ListInputButton onClick={toggleIsGroup}>
          {isGroup ? <>&#8213;</> : <>&#9776;</>}
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
  const importTextareaRef = useRef<HTMLTextAreaElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const instructionsPasteId = "instructions-paste-area";
  return (
    <FieldWrapper label={label} id={id}>
      <details ref={detailsRef}>
        <summary>Paste Instructions</summary>
        <textarea
          title="Instructions Paste Area"
          id={instructionsPasteId}
          ref={importTextareaRef}
          className={clsx(baseInputStyle, "w-full h-36")}
        />
        <div className="my-1 flex flex-row">
          <Button
            onClick={() => {
              const value = importTextareaRef.current?.value;
              const values = value ? parseInstructions(value) : [];
              dispatch({
                type: "RESET",
                values,
              });
              if (detailsRef.current) {
                detailsRef.current.open = false;
              }
            }}
          >
            Import Instructions
          </Button>
        </div>
      </details>
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
