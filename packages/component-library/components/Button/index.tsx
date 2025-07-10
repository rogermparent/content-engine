import clsx from "clsx";
import { MouseEventHandler, ReactNode } from "react";
import {
  buttonVariants,
  Button as ShadcnButton,
} from "component-library/components/ui/button";

export function Button({
  children,
  type = "button",
  onClick,
  className,
  disabled,
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
      className={className}
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
    <button
      className={clsx(className, "group")}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      <span
        className={clsx(buttonVariants({ variant: "default", size: "sm" }))}
      >
        {children}
      </span>
    </button>
  );
}
