import { ChangeEventHandler } from "react";
import { Errors, FieldWrapper, baseInputStyle } from "../..";
import clsx from "clsx";

function DurationNumberInput({
  parentName,
  parentLabel,
  childName,
  label,
  defaultValue,
  onChange,
  placeholder,
}: {
  parentName: string;
  parentLabel?: string;
  childName: string;
  label: string;
  defaultValue?: number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  const fullName = `${parentName}.${childName}`;
  return (
    <div className="flex flex-col flex-nowrap w-full text-sm">
      <label htmlFor={fullName}>{label}</label>
      <input
        title={parentLabel ? `${parentLabel} ${label}` : label}
        type="number"
        name={fullName}
        id={fullName}
        className={clsx(baseInputStyle, "px-2 py-1 w-16")}
        min={0}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export function DurationInput({
  name,
  id = name,
  defaultValue,
  onChange,
  label,
  errors,
  value,
  onHoursChange,
  onMinutesChange,
  placeholder,
}: {
  name: string;
  id?: string;
  label?: string;
  defaultValue?: number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  errors?: string[];
  value?: string;
  onHoursChange?: ChangeEventHandler<HTMLInputElement>;
  onMinutesChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: number;
}) {
  const defaultHours = defaultValue ? Math.floor(defaultValue / 60) : undefined;
  const defaultMinutes = defaultValue ? defaultValue % 60 : undefined;
  const placeholderHours = placeholder
    ? String(Math.floor(placeholder / 60))
    : undefined;
  const placeholderMinutes = placeholder ? String(placeholder % 60) : undefined;
  return (
    <FieldWrapper label={label} id={id}>
      <Errors errors={errors} />
      <div className="flex flex-row flex-nowrap gap-2 w-full">
        <DurationNumberInput
          parentName={name}
          parentLabel={label}
          childName="hours"
          label="Hours"
          defaultValue={defaultHours}
          placeholder={placeholderHours}
          onChange={onHoursChange}
        />
        <DurationNumberInput
          parentName={name}
          parentLabel={label}
          childName="minutes"
          label="Minutes"
          defaultValue={defaultMinutes}
          placeholder={placeholderMinutes}
          onChange={onMinutesChange}
        />
      </div>
    </FieldWrapper>
  );
}
