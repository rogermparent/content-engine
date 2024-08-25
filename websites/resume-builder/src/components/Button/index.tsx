import clsx from "clsx";
import { MouseEventHandler, ReactNode } from "react";

export function Button({
  children,
  type = "button",
  onClick,
  className,
}: {
  children: ReactNode;
  type?: HTMLButtonElement["type"];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <button
      className={clsx(
        "rounded-md px-2 py-1 bg-slate-700 hover:bg-slate-500",
        className,
      )}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
