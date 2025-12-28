import clsx from "clsx";
import { RecipeFormErrors } from "../../../controller/formState";
import { TimelineEvent, Timeline } from "../../../controller/types";
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
import { TextAreaInput } from "component-library/components/Form/inputs/TextArea";

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

function TimelineEventsInput({
  name,
  id,
  defaultValue,
  errors,
}: {
  name: string;
  id: string;
  defaultValue?: TimelineEvent[];
  errors?: RecipeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<TimelineEvent>(defaultValue || []);
  useEffect(() => {
    dispatch({ type: "RESET", values: defaultValue || [] });
  }, [defaultValue, dispatch]);

  return (
    <>
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
    </>
  );
}

function TimelineInput({
  name,
  id,
  defaultValue,
  index,
  dispatch,
  errors,
}: {
  name: string;
  id: string;
  defaultValue?: Timeline;
  index: number;
  dispatch: ActionDispatch<[KeyListAction<Timeline>]>;
  errors?: RecipeFormErrors;
}) {
  const timelineName = defaultValue?.name || `Timeline ${index + 1}`;

  return (
    <fieldset
      className="border-2 p-4 rounded mb-4 bg-slate-800 border-slate-600"
      aria-label={`${timelineName} editor`}
    >
      <div className="flex flex-row justify-between items-start gap-2 mb-4">
        <div className="flex-1">
          <TextInput
            label="Timeline Name"
            name={`${name}.name`}
            id={`${id}-name`}
            defaultValue={defaultValue?.name}
            errors={errors?.[`${name}.name`]}
            placeholder="e.g., 'Dough', 'Sauce', 'Assembly'"
          />
        </div>
        <div className="mt-6">
          <InputListControls dispatch={dispatch} index={index} />
        </div>
      </div>

      <div className="mb-4">
        <DurationInput
          label="Starting Offset (minutes before recipe start)"
          name={`${name}.default_offset`}
          id={`${id}-default-offset`}
          defaultValue={defaultValue?.default_offset}
          errors={errors?.[`${name}.default_offset`]}
        />
      </div>

      <div className="mb-4">
        <TextAreaInput
          label="Note (optional)"
          name={`${name}.note`}
          id={`${id}-note`}
          defaultValue={defaultValue?.note}
          errors={errors?.[`${name}.note`]}
        />
      </div>

      <div className="border-t border-slate-700 pt-4">
        <h4 className="text-sm font-semibold mb-2">Events</h4>
        <TimelineEventsInput
          name={`${name}.events`}
          id={`${id}-events`}
          defaultValue={defaultValue?.events}
          errors={errors}
        />
      </div>
    </fieldset>
  );
}

export function TimelinesInput({
  name,
  id,
  defaultValue,
  label,
  errors,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: Timeline[];
  errors?: RecipeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<Timeline>(defaultValue || []);
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
              <TimelineInput
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
          Add Timeline
        </Button>
      </div>
    </FieldWrapper>
  );
}
