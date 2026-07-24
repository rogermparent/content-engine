import { ReactNode } from "react";

export const baseInputStyle =
  "text-foreground bg-background border border-input rounded-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="font-semibold text-sm py-1">
      {children}
    </label>
  );
}

export function FieldWrapper({
  label,
  id,
  children,
}: {
  label?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col flex-nowrap mb-1">
      {label && <Label htmlFor={id}>{label}</Label>}
      {children}
    </div>
  );
}

export function Errors({ errors }: { errors?: string[] }) {
  return (
    errors && (
      <div aria-live="polite" aria-atomic="true">
        {errors &&
          errors.map((error: string) => (
            <p className="mt-2 text-sm text-destructive" key={error}>
              {error}
            </p>
          ))}
      </div>
    )
  );
}
