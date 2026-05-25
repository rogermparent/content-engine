import { ChangeEventHandler } from "react";
import { Errors, FieldWrapper, baseInputStyle } from "../..";
import clsx from "clsx";

export function CheckboxInput({
  name,
  id = name,
  defaultChecked,
  checked,
  onChange,
  label,
  placeholder,
  errors,
  list,
}: {
  name: string;
  id?: string;
  label?: string;
  defaultChecked?: boolean;
  /** Controlled checked state; when provided the input is controlled. */
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  errors?: string[];
  list?: string;
}) {
  // Avoid passing both checked and defaultChecked (React would warn).
  const checkedProps = checked !== undefined ? { checked } : { defaultChecked };
  return (
    <FieldWrapper label={label} id={id}>
      <Errors errors={errors} />
      <input
        type="checkbox"
        name={name}
        id={id}
        className={clsx(baseInputStyle)}
        {...checkedProps}
        onChange={onChange}
        placeholder={placeholder}
        list={list}
      />
    </FieldWrapper>
  );
}
