import { ReactNode } from "react";

/**
 * A small bench card for a single labelled datum — a duration, the scale input,
 * the yield. The label is a quiet mono eyebrow; the value sits in mono tabular
 * figures, tying every number on the page to the scaling feature (the Working
 * Bench signature move).
 */
export function InfoCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-card p-2 text-center">
      {title && (
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
      )}
      <div className="mt-0.5 font-mono tabular-nums text-foreground">
        {children}
      </div>
    </div>
  );
}
