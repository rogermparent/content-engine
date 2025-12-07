"use client";

import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from "react";
import { TimelineEvent } from "../../../controller/types";
import clsx from "clsx";

type LocalTimelineEvent = TimelineEvent & { currentLength: number };

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ResizeHandle({
  onResizeStart,
}: {
  onResizeStart: (e: ReactMouseEvent) => void;
}) {
  return (
    <div
      className="w-4 h-full absolute right-0 top-0 cursor-col-resize hover:bg-slate-500/50 flex items-center justify-center z-10 group"
      onMouseDown={onResizeStart}
    >
      <div className="w-1 h-4 bg-slate-400 rounded group-hover:bg-slate-200" />
    </div>
  );
}

function EventBlock({
  event,
  scale,
  onResize,
}: {
  event: LocalTimelineEvent;
  scale: number;
  onResize: (targetWidthPixels: number) => void;
}) {
  const width = event.currentLength * scale;
  // Only resizable if min or max length constraints are present and different
  const isResizable =
    (event.minLength !== undefined || event.maxLength !== undefined) &&
    event.minLength !== event.maxLength;

  const handleResizeStart = (e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = event.currentLength * scale;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const targetWidth = startWidth + (currentX - startX);
      onResize(targetWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      className={clsx(
        "relative h-16 border-r border-slate-700 flex flex-col justify-center px-2 overflow-hidden transition-colors select-none",
        event.activeTime ? "bg-amber-900/50" : "bg-slate-800/50",
      )}
      style={{ width: `${width}px`, minWidth: isResizable ? "2rem" : undefined }}
      title={`${event.name}: ${formatDuration(event.currentLength)}`}
    >
      <div className="text-sm font-semibold truncate">{event.name}</div>
      <div className="text-xs opacity-75">
        {formatDuration(event.currentLength)}
      </div>
      {isResizable && <ResizeHandle onResizeStart={handleResizeStart} />}
    </div>
  );
}

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  const [timelineEvents, setTimelineEvents] = useState<LocalTimelineEvent[]>(
    [],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2); // Pixels per minute

  useEffect(() => {
    if (events) {
        setTimelineEvents(
            events.map((e) => ({ ...e, currentLength: e.defaultLength })),
        );
    }
  }, [events]);

  // Auto-calculate scale to fit container whenever events change
  useEffect(() => {
    if (containerRef.current && timelineEvents.length > 0) {
      const totalMinutes = timelineEvents.reduce((acc, e) => acc + e.currentLength, 0);
      const containerWidth = containerRef.current.clientWidth;
      
      if (totalMinutes > 0) {
         // Scale to fit exactly in the container
         const newScale = containerWidth / totalMinutes;
         setScale(newScale);
      }
    }
  }, [timelineEvents]);

  const handleResize = (index: number, targetWidthPixels: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;

    setTimelineEvents((prev) => {
      const newEvents = [...prev];
      const event = newEvents[index];
      
      const totalDuration = prev.reduce((acc, e) => acc + e.currentLength, 0);
      const otherEventsDuration = totalDuration - event.currentLength;

      let newLength;

      if (otherEventsDuration === 0) {
         // If there's only one event (or others have 0 duration), fallback to linear scaling.
         // Use current scale to estimate drag sensitivity.
         const currentScale = containerWidth / (totalDuration || 1);
         const deltaPixels = targetWidthPixels - (event.currentLength * currentScale);
         newLength = event.currentLength + deltaPixels / currentScale;
      } else {
         // Formula: L = (w * T) / (W - w)
         // Clamp targetWidth to avoid division by zero or negative results.
         // The event must have at least some width, and cannot exceed container width.
         const clampedWidth = Math.max(1, Math.min(targetWidthPixels, containerWidth - 1));
         newLength = (clampedWidth * otherEventsDuration) / (containerWidth - clampedWidth);
      }

      // Apply constraints
      if (event.minLength !== undefined) {
        newLength = Math.max(newLength, event.minLength);
      }
      // If no minLength is defined but resizing is allowed (implies maxLength is defined), 
      // prevent shrinking below 1 minute to keep it visible/usable
      else {
         newLength = Math.max(newLength, 1); 
      }
      
      if (event.maxLength !== undefined) {
        newLength = Math.min(newLength, event.maxLength);
      }

      // Snap to nearest integer minute
      newLength = Math.round(newLength);

      // Only update if changed
      if (newLength !== event.currentLength) {
        newEvents[index] = { ...event, currentLength: newLength };
        return newEvents;
      }
      return prev;
    });
  };

  if (!events || events.length === 0) {
      return null;
  }

  const totalDuration = timelineEvents.reduce(
    (acc, e) => acc + e.currentLength,
    0,
  );

  return (
    <div className="w-full my-6 p-4 bg-slate-900 rounded-md border border-slate-800">
      <div className="flex flex-row justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Timeline</h3>
        <div className="text-sm text-slate-300">
            Total: {formatDuration(totalDuration)}
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full overflow-hidden border border-slate-700 rounded bg-slate-950"
      >
        <div
            className="flex flex-row h-full w-full"
        >
          {timelineEvents.map((event, index) => (
            <EventBlock
              key={index}
              event={event}
              scale={scale}
              onResize={(targetWidth) => handleResize(index, targetWidth)}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Drag the edges of events to experiment with timing variations.
      </p>
    </div>
  );
}
