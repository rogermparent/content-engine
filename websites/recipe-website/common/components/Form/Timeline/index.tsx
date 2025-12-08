import clsx from "clsx";
import { RecipeFormErrors } from "../../../controller/formState";
import { TimelineEvent } from "../../../controller/types";
import { Button } from "component-library/components/Button";
import { FieldWrapper } from "component-library/components/Form";
import {
  InputListControls,
  KeyListAction,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { ActionDispatch, useEffect } from "react";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { DurationInput } from "component-library/components/Form/inputs/Duration";
import { CheckboxInput } from "component-library/components/Form/inputs/Checkbox";

function TimelineEventInput({
  name,
  id,
  defaultValue,
  index,
  dispatch,
  errors,
}: {
  name: string;
  id: string;
  defaultValue?: TimelineEvent;
  index: number;
  dispatch: ActionDispatch<[KeyListAction<TimelineEvent>]>;
  errors?: RecipeFormErrors;
}) {
  return (
    <div className="border p-2 rounded mb-2 bg-slate-900 border-slate-700">
      <div className="flex flex-row justify-between items-start gap-2">
        <div className="flex-1">
          <TextInput
            label="Event Name"
            name={`${name}.name`}
            id={`${id}-name`}
            defaultValue={defaultValue?.name}
            errors={errors?.[`${name}.name`]}
          />
        </div>
        <div className="mt-6">
          <InputListControls dispatch={dispatch} index={index} />
        </div>
      </div>

      <div className="my-2">
        <CheckboxInput
          label="Active Time?"
          name={`${name}.activeTime`}
          id={`${id}-activeTime`}
          defaultChecked={defaultValue?.activeTime}
        />
      </div>

      <div className="flex flex-row gap-2 flex-wrap">
        <DurationInput
          label="Default Length"
          name={`${name}.defaultLength`}
          id={`${id}-defaultLength`}
          defaultValue={defaultValue?.defaultLength}
          errors={errors?.[`${name}.defaultLength`]}
        />
        <DurationInput
          label="Max Length"
          name={`${name}.maxLength`}
          id={`${id}-maxLength`}
          defaultValue={defaultValue?.maxLength}
          errors={errors?.[`${name}.maxLength`]}
        />
        <DurationInput
          label="Min Length"
          name={`${name}.minLength`}
          id={`${id}-minLength`}
          defaultValue={defaultValue?.minLength}
          errors={errors?.[`${name}.minLength`]}
        />
      </div>
    </div>
  );
}

export function TimelineListInput({
  name,
  id,
  defaultValue,
  label,
  errors,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: TimelineEvent[];
  errors?: RecipeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<TimelineEvent>(defaultValue || []);
  useEffect(() => {
    dispatch({ type: "RESET", values: defaultValue || [] });
  }, [defaultValue, dispatch]);

  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemKey = `${name}[${index}]`;
          const itemId = `${id}-${index}`;

          return (
            <li key={key} className="flex flex-col my-1">
              <TimelineEventInput
                name={itemKey}
                id={itemId}
                index={index}
                defaultValue={defaultValue}
                dispatch={dispatch}
                errors={errors}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex flex-row">
        <Button
          onClick={() =>
            dispatch({
              type: "APPEND",
            })
          }
        >
          Add Timeline Event
        </Button>
      </div>
    </FieldWrapper>
  );
}
