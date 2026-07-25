import { Timeline } from "../../controller/types";

/** Compact, read-only rendering of a duration in the app's "1h 30m" style. */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

/**
 * A read-only schedule strip built from a recipe's first timeline. Each event
 * becomes a segment sized proportionally to its `defaultLength`; active (hands-on)
 * events read in the ember accent, rests stay quiet. This is the hero's timeline
 * preview — the full interactive schedule editor lives on the detail page (PR 6).
 */
export function CompactTimeline({ timelines }: { timelines: Timeline[] }) {
  const timeline = timelines[0];
  const events = timeline?.events ?? [];
  if (events.length === 0) return null;

  const total = events.reduce((sum, e) => sum + (e.defaultLength || 0), 0) || 1;

  // A spoken summary so the proportional bar isn't the only way to read the plan.
  const summary = events
    .map(
      (e) =>
        `${e.name || "Step"} ${formatDuration(e.defaultLength)}${
          e.activeTime ? " active" : ""
        }`,
    )
    .join(", ");

  return (
    <figure className="m-0" aria-label={`Schedule: ${summary}`}>
      <figcaption className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {timeline.name || "Schedule"}
        </span>
        <span className="font-mono tabular-nums text-[0.65rem] text-muted-foreground">
          {formatDuration(total)}
        </span>
      </figcaption>
      <div
        className="flex h-11 w-full overflow-hidden rounded-md border border-border"
        role="presentation"
      >
        {events.map((event, i) => {
          const pct = ((event.defaultLength || 0) / total) * 100;
          return (
            <div
              key={i}
              className={`flex min-w-0 flex-col justify-center overflow-hidden px-2 ${
                i > 0 ? "border-l border-border" : ""
              } ${
                event.activeTime
                  ? "bg-primary/20 text-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              style={{ flexBasis: `${pct}%` }}
            >
              <span className="truncate text-[0.7rem] font-medium leading-tight">
                {event.name || "Step"}
              </span>
              <span className="truncate font-mono tabular-nums text-[0.65rem] leading-tight">
                {formatDuration(event.defaultLength)}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export default CompactTimeline;
