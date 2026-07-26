import { ReactNode } from "react";

/**
 * The detail hero's canonical meta strip — Prep · Cook · Total · Yield in the
 * house instrument language (mono uppercase eyebrow over a mono tabular value),
 * filling what used to be the hero's dead right column. Hairline dividers come
 * from a `bg-border` grid gap so the strip reads as one instrument in both the
 * 4-across desktop layout and the 2×2 mobile wrap. Empty items are dropped by
 * the caller. Prints (no `print:hidden`) — the times belong on paper.
 */
export function MetaBar({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  if (items.length === 0) return null;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
      {items.map(({ label, value }, i) => (
        <div key={i} className="flex flex-col gap-0.5 bg-card px-3 py-2">
          <dt className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {label}
          </dt>
          <dd className="font-mono tabular-nums text-sm text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

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
