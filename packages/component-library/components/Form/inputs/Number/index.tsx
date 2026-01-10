import { ChangeEventHandler } from "react";
import { Errors, FieldWrapper, baseInputStyle } from "../..";
import clsx from "clsx";

export function NumberInput({
  name,
  id = name,
  defaultValue,
  onChange,
  label,
  placeholder,
  errors,
  list,
  value,
  min,
  max,
  step,
}: {
  name: string;
  id?: string;
  label?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  errors?: string[];
  list?: string;
  value?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <FieldWrapper label={label} id={id}>
      <Errors errors={errors} />
      <input
        type="number"
        name={name}
        id={id}
        className={clsx(baseInputStyle, "px-2 py-1")}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        list={list}
        value={value}
        min={min}
        max={max}
        step={step}
      />
    </FieldWrapper>
  );
}
