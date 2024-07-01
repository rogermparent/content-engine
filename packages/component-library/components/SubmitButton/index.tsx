"use client";

import { ReactNode } from "react";
import { Button } from "../Button";
import { useFormStatus } from "react-dom";

export const defaultButtonStyles =
  "rounded-md px-2 py-1 bg-slate-700 hover:bg-slate-500 disabled:bg-gray-900 disabled:text-gray-400 disabled:italic";

export function SubmitButton({
  children,
  className,
  disabled,
  overrideDefaultStyles,
  name,
  value,
  pendingChildren,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  overrideDefaultStyles?: boolean;
  name?: string;
  value?: string;
  pendingChildren?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className={className}
      disabled={disabled || pending}
      overrideDefaultStyles={overrideDefaultStyles}
      name={name}
      value={value}
    >
      {pendingChildren !== undefined && pending ? pendingChildren : children}
    </Button>
  );
}
