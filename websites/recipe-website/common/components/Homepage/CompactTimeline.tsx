import { Timeline } from "../../controller/types";
import { formatDurationCompact } from "../../util/formatDuration";
import { TimelineStrip } from "../TimelineStrip";

/**
 * The homepage hero's timeline preview: the recipe's first timeline as one
 * read-only proportional strip. A thin wrapper over the shared `TimelineStrip`
 * that supplies a spoken summary as the figure's accessible name (so the bar
 * isn't the only way to read the plan). The full interactive schedule editor
 * lives on the detail page (`RecipeSchedule`, PR 6).
 */
export function CompactTimeline({ timelines }: { timelines: Timeline[] }) {
  const timeline = timelines[0];
  const events = timeline?.events ?? [];
  if (events.length === 0) return null;

  // A spoken summary so the proportional bar isn't the only way to read the plan.
  const summary = events
    .map(
      (e) =>
        `${e.name || "Step"} ${formatDurationCompact(e.defaultLength)}${
          e.activeTime ? " active" : ""
        }`,
    )
    .join(", ");

  return <TimelineStrip timeline={timeline} label={`Schedule: ${summary}`} />;
}

export default CompactTimeline;
