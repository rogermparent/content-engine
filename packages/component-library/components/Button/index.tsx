import clsx from "clsx";
import { MouseEventHandler, ReactNode } from "react";
import { Button as ShadcnButton } from "component-library/components/ui/button";

export const defaultButtonStyles =
  "rounded-md px-2 py-1 bg-slate-700 hover:bg-slate-500 disabled:bg-gray-900 disabled:text-gray-400 disabled:italic";

export function Button({
  children,
  type = "button",
  onClick,
  className,
  disabled,
  overrideDefaultStyles,
  name,
  value,
}: {
  children: ReactNode;
  type?: HTMLButtonElement["type"];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  overrideDefaultStyles?: boolean;
  name?: string;
  value?: string;
}) {
  return (
    <ShadcnButton
      className={clsx(!overrideDefaultStyles && defaultButtonStyles, className)}
      onClick={onClick}
      type={type}
      disabled={disabled}
      name={name}
      value={value}
    >
      {children}
    </ShadcnButton>
  );
}

export function PaddedButton({
  children,
  type = "button",
  onClick,
  className,
  disabled,
}: {
  children: ReactNode;
  type?: HTMLButtonElement["type"];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <ShadcnButton
      className={clsx(className, "group")}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      <span className="rounded-md px-2 py-1 bg-slate-700 group-hover:bg-slate-500 disabled:bg-gray-900 disabled:text-gray-400 disabled:italic">
        {children}
      </span>
    </ShadcnButton>
  );
}
