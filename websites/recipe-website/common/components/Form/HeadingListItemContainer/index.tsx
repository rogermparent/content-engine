import clsx from "clsx";
import { ActionDispatch, ReactNode } from "react";
import {
  InputListControls,
  KeyListAction,
} from "component-library/components/Form/inputs/List";

interface HeadingListItemContainerProps<T> {
  isHeading: boolean;
  onToggleHeading: () => void;
  itemLabel?: string;
  headingLabel?: string;
  index: number;
  dispatch: ActionDispatch<[KeyListAction<T>]>;
  name: string;
  children: ReactNode;
}

export function HeadingListItemContainer<T>({
  isHeading,
  onToggleHeading,
  itemLabel = "Item",
  headingLabel = "Heading",
  index,
  dispatch,
  name,
  children,
}: HeadingListItemContainerProps<T>) {
  return (
    <div
      className={clsx(
        "transition p-2 rounded-xs border mb-2",
        isHeading
          ? "bg-slate-800 border-slate-600"
          : "bg-slate-950 border-slate-700",
      )}
      aria-label={`${itemLabel} ${index + 1} Container`}
    >
      {isHeading && <input type="hidden" name={`${name}.type`} value="heading" />}
      {children}
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
        <button
          type="button"
          onClick={onToggleHeading}
          aria-label={`Toggle ${itemLabel} ${index + 1} Type`}
          className={clsx(
            "text-xs text-slate-400 hover:text-slate-300 p-2",
            isHeading ? "text-slate-500" : "text-slate-300",
          )}
        >
          {isHeading ? headingLabel : itemLabel}
        </button>
      </div>
    </div>
  );
}
