import { Timeline } from "../../controller/types";
import { formatDurationCompact } from "../../util/formatDuration";

/**
 * A read-only schedule strip for a single timeline. Each event becomes a segment
 * sized proportionally to its `defaultLength`; active (hands-on) events read in
 * the ember accent, rests stay quiet. Durations are set in mono tabular figures
 * — the recipe's timing treated as material (the Working Bench signature move).
 *
 * This is the shared primitive behind both the homepage hero's `CompactTimeline`
 * and the detail page's collapsed `RecipeSchedule`. The figure's accessible name
 * is supplied by the caller (`label`) so each surface can name it in its own
 * vocabulary while the visible strip stays identical.
 */
export function TimelineStrip({
  timeline,
  label,
  showNote = false,
  className = "m-0",
}: {
  timeline: Timeline;
  label: string;
  showNote?: boolean;
  className?: string;
}) {
  const events = timeline?.events ?? [];
  if (events.length === 0) return null;

  const total = events.reduce((sum, e) => sum + (e.defaultLength || 0), 0) || 1;

  return (
    <figure className={className} aria-label={label}>
      <figcaption className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {timeline.name || "Schedule"}
        </span>
        <span className="font-mono tabular-nums text-[0.65rem] text-muted-foreground">
          {formatDurationCompact(total)}
        </span>
      </figcaption>
      {showNote && timeline.note && (
        <p className="mb-1.5 text-xs text-muted-foreground">{timeline.note}</p>
      )}
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
                {formatDurationCompact(event.defaultLength)}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export default TimelineStrip;
