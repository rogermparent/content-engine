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
  KeyListAction,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import clsx from "clsx";
import { Dispatch, useEffect, useRef, useState } from "react";
import InstructionTextInput from "./InstructionTextInput";
import { InstructionControls } from "../RecipeMarkdown";

function InstructionInput({
  currentDefaultItem,
  itemKey,
}: {
  currentDefaultItem?: Instruction;
  itemKey: string;
  index: number;
  dispatch: Dispatch<KeyListAction>;
}) {
  return (
    <div>
      <TextInput
        label="Name"
        name={`${itemKey}.name`}
        defaultValue={currentDefaultItem?.name}
        key={currentDefaultItem?.name}
      />
      <TextAreaInput
        label="Text"
        name={`${itemKey}.text`}
        defaultValue={currentDefaultItem?.text}
        key={currentDefaultItem?.text}
      />
    </div>
  );
}

function InstructionGroupInput({
  currentDefaultItem,
  itemKey,
}: {
  currentDefaultItem?: InstructionGroup;
  itemKey: string;
  index: number;
  dispatch: Dispatch<KeyListAction>;
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
                    index={index}
                    dispatch={childDispatch}
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
            Append
          </Button>
        </div>
      </FieldWrapper>
    </div>
  );
}

function entryIsGroup(entry: InstructionEntry | undefined): boolean {
  return Boolean(entry && "instructions" in entry && entry.instructions);
}

function InstructionEntryInput({
  defaultValue,
  itemKey,
  index,
  dispatch,
}: {
  defaultValue?: InstructionEntry;
  itemKey: string;
  index: number;
  dispatch: Dispatch<KeyListAction>;
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
        <InstructionTextInput
          currentDefaultItem={defaultValue as Instruction}
          itemKey={itemKey}
          dispatch={dispatch}
          index={index}
          toggleIsGroup={toggleIsGroup}
        />
      )}
      <div className="flex flex-row flex-nowrap justify-center">
        <InstructionControls
          dispatch={dispatch}
          index={index}
          toggleIsGroup={toggleIsGroup}
        />
      </div>
    </li>
  );
}

function parseInstructions(value: string): InstructionEntry[] {
  return value.split(/\n+/).map((instruction) => ({ text: instruction }));
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
        Append
      </Button>
    </FieldWrapper>
  );
}
