"use client";

import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from "react";
import { TimelineEvent, Timeline } from "../../../controller/types";
import clsx from "clsx";

type LocalTimelineEvent = TimelineEvent & { currentLength: number };
type LocalTimeline = {
  name?: string;
  note?: string;
  currentOffset: number;
  events: LocalTimelineEvent[];
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ResizeHandle({
  onResizeStart,
  ariaLabel,
}: {
  onResizeStart: (e: ReactMouseEvent) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="w-4 h-full absolute right-0 top-0 cursor-col-resize hover:bg-slate-500/50 flex items-center justify-center z-10 group"
      onMouseDown={onResizeStart}
      role="slider"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className="w-1 h-4 bg-slate-400 rounded group-hover:bg-slate-200" />
    </div>
  );
}

function EventBlock({
  event,
  scale,
  onResize,
  hasOverlap,
}: {
  event: LocalTimelineEvent;
  scale: number;
  onResize: (targetWidthPixels: number) => void;
  hasOverlap?: boolean;
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

  const eventLabel = event.name || "Unnamed event";
  const durationText = formatDuration(event.currentLength);
  
  return (
    <div
      className={clsx(
        "relative h-16 border-r border-slate-700 flex flex-col justify-center px-2 overflow-hidden transition-colors select-none",
        {
          "bg-red-900/70 border-red-500": hasOverlap && event.activeTime,
          "bg-amber-900/50": !hasOverlap && event.activeTime,
          "bg-slate-800/50": !event.activeTime,
        }
      )}
      style={{ width: `${width}px`, minWidth: isResizable ? "2rem" : undefined }}
      role="article"
      aria-label={`${eventLabel}: ${durationText}${isResizable ? " (resizable)" : ""}${hasOverlap ? " (overlap conflict)" : ""}`}
    >
      <div className="text-sm font-semibold truncate">{event.name}</div>
      <div className="text-xs opacity-75" aria-label={`Duration: ${durationText}`}>
        {durationText}
      </div>
      {hasOverlap && event.activeTime && (
        <div className="absolute top-1 right-6 text-red-400 text-xs font-bold">⚠</div>
      )}
      {isResizable && (
        <ResizeHandle 
          onResizeStart={handleResizeStart} 
          ariaLabel={`Resize ${eventLabel}`}
        />
      )}
    </div>
  );
}

function OffsetBlock({
  offset,
  scale,
  onResize,
}: {
  offset: number;
  scale: number;
  onResize: (targetWidthPixels: number) => void;
}) {
  const width = offset * scale;
  const isZero = offset === 0;

  const handleResizeStart = (e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = offset * scale;

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

  const offsetText = formatDuration(offset);
  
  // When offset is 0, show only the handle with border
  if (isZero) {
    return (
      <div
        className="relative h-16 border-r border-slate-700 flex flex-col justify-center overflow-hidden transition-colors select-none"
        style={{ width: "1rem" }}
        role="article"
        aria-label={`Offset: ${offsetText}`}
      >
        <ResizeHandle 
          onResizeStart={handleResizeStart}
          ariaLabel="Resize timeline offset"
        />
      </div>
    );
  }
  
  return (
    <div
      className="relative h-16 border-r border-slate-700 flex flex-col justify-center px-2 overflow-hidden bg-slate-950/30 transition-colors select-none"
      style={{ width: `${width}px`, minWidth: "2rem" }}
      role="article"
      aria-label={`Offset: ${offsetText}`}
    >
      <div className="text-xs opacity-50 truncate">Offset</div>
      <div className="text-xs opacity-75" aria-label={`Offset duration: ${offsetText}`}>
        {offsetText}
      </div>
      <ResizeHandle 
        onResizeStart={handleResizeStart}
        ariaLabel="Resize timeline offset"
      />
    </div>
  );
}

function TimelineRow({
  timeline,
  scale,
  onOffsetResize,
  onEventResize,
  maxDuration,
  showOffset,
  overlappingEvents,
}: {
  timeline: LocalTimeline;
  scale: number;
  onOffsetResize: (targetWidthPixels: number) => void;
  onEventResize: (eventIndex: number, targetWidthPixels: number) => void;
  maxDuration: number;
  showOffset: boolean;
  overlappingEvents: Set<number>;
}) {
  const totalEventDuration = timeline.events.reduce(
    (acc, e) => acc + e.currentLength,
    0,
  );

  const durationText = formatDuration(totalEventDuration);
  const timelineName = timeline.name || "Timeline";
  const timelineId = timeline.name 
    ? `timeline-${timeline.name.replace(/\s+/g, '-').toLowerCase()}`
    : undefined;
  
  return (
    <div className="mb-4 last:mb-0" role="region" aria-label={`Timeline: ${timelineName}`}>
      <div className="flex flex-row justify-between items-center mb-1">
        <div className="flex flex-col">
          {timeline.name && (
            <h4 className="text-sm font-semibold" id={timelineId}>
              {timeline.name}
            </h4>
          )}
          {timeline.note && (
            <p className="text-xs text-slate-400">{timeline.note}</p>
          )}
        </div>
        <div 
          className="text-xs text-slate-300"
          aria-label={`${timelineName} duration: ${durationText}`}
        >
          Duration: {durationText}
        </div>
      </div>
      <div 
        className="w-full overflow-hidden border border-slate-700 rounded bg-slate-950"
        role="group"
        aria-label={`${timelineName} events`}
      >
        <div className="flex flex-row h-full w-fit max-w-full">
          {showOffset && (
            <OffsetBlock
              offset={timeline.currentOffset}
              scale={scale}
              onResize={onOffsetResize}
            />
          )}
          {timeline.events.map((event, index) => (
            <EventBlock
              key={index}
              event={event}
              scale={scale}
              onResize={(targetWidth) => onEventResize(index, targetWidth)}
              hasOverlap={overlappingEvents.has(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimelineView({ timelines }: { timelines: Timeline[] }) {
  const [localTimelines, setLocalTimelines] = useState<LocalTimeline[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2); // Pixels per minute

  useEffect(() => {
    if (timelines) {
      setLocalTimelines(
        timelines.map((t) => ({
          name: t.name,
          note: t.note,
          currentOffset: t.default_offset || 0,
          events: t.events.map((e) => ({ ...e, currentLength: e.defaultLength })),
        })),
      );
    }
  }, [timelines]);

  // Auto-calculate scale to fit container based on the longest timeline
  useEffect(() => {
    if (containerRef.current && localTimelines.length > 0) {
      const maxDuration = Math.max(
        ...localTimelines.map((t) => {
          const eventsDuration = t.events.reduce((acc, e) => acc + e.currentLength, 0);
          return t.currentOffset + eventsDuration;
        }),
      );
      const containerWidth = containerRef.current.clientWidth;

      if (maxDuration > 0) {
        const newScale = containerWidth / maxDuration;
        setScale(newScale);
      }
    }
  }, [localTimelines]);

  const handleOffsetResize = (timelineIndex: number, targetWidthPixels: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;

    setLocalTimelines((prev) => {
      const newTimelines = [...prev];
      const timeline = newTimelines[timelineIndex];

      const eventsDuration = timeline.events.reduce((acc, e) => acc + e.currentLength, 0);

      let newOffset;

      if (eventsDuration === 0) {
        const currentScale = containerWidth / (timeline.currentOffset || 1);
        const deltaPixels = targetWidthPixels - (timeline.currentOffset * currentScale);
        newOffset = timeline.currentOffset + deltaPixels / currentScale;
      } else {
        const clampedWidth = Math.max(1, Math.min(targetWidthPixels, containerWidth - 1));
        newOffset = (clampedWidth * eventsDuration) / (containerWidth - clampedWidth);
      }

      // Offset must be non-negative
      newOffset = Math.max(0, Math.round(newOffset));

      if (newOffset !== timeline.currentOffset) {
        newTimelines[timelineIndex] = { ...timeline, currentOffset: newOffset };
        return newTimelines;
      }
      return prev;
    });
  };

  const handleEventResize = (
    timelineIndex: number,
    eventIndex: number,
    targetWidthPixels: number,
  ) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;

    setLocalTimelines((prev) => {
      const newTimelines = [...prev];
      const timeline = newTimelines[timelineIndex];
      const event = timeline.events[eventIndex];

      const totalDuration = timeline.events.reduce((acc, e) => acc + e.currentLength, 0);
      const otherEventsDuration = totalDuration - event.currentLength;

      let newLength;

      if (otherEventsDuration === 0) {
        // When there's only one event, convert pixels directly to duration using scale
        newLength = targetWidthPixels / scale;
      } else {
        // When there are multiple events, use proportional formula
        const clampedWidth = Math.max(1, Math.min(targetWidthPixels, containerWidth - 1));
        newLength = (clampedWidth * otherEventsDuration) / (containerWidth - clampedWidth);
      }

      // Apply constraints
      if (event.minLength !== undefined) {
        newLength = Math.max(newLength, event.minLength);
      } else {
        newLength = Math.max(newLength, 1);
      }

      if (event.maxLength !== undefined) {
        newLength = Math.min(newLength, event.maxLength);
      }

      newLength = Math.round(newLength);

      if (newLength !== event.currentLength) {
        const newEvents = [...timeline.events];
        newEvents[eventIndex] = { ...event, currentLength: newLength };
        newTimelines[timelineIndex] = { ...timeline, events: newEvents };
        return newTimelines;
      }
      return prev;
    });
  };

  if (!timelines || timelines.length === 0) {
    return null;
  }

  const maxDuration = Math.max(
    ...localTimelines.map((t) => {
      const eventsDuration = t.events.reduce((acc, e) => acc + e.currentLength, 0);
      return t.currentOffset + eventsDuration;
    }),
  );

  const maxDurationText = formatDuration(maxDuration);
  
  const showOffsets = localTimelines.length > 1;
  
  // Calculate overlapping active events across timelines
  const overlappingEventsMap = new Map<number, Set<number>>();
  
  if (localTimelines.length > 1) {
    // Build a list of all active events with their time ranges
    const activeEvents: Array<{
      timelineIndex: number;
      eventIndex: number;
      startTime: number;
      endTime: number;
    }> = [];
    
    localTimelines.forEach((timeline, timelineIndex) => {
      let currentTime = timeline.currentOffset;
      timeline.events.forEach((event, eventIndex) => {
        if (event.activeTime) {
          activeEvents.push({
            timelineIndex,
            eventIndex,
            startTime: currentTime,
            endTime: currentTime + event.currentLength,
          });
        }
        currentTime += event.currentLength;
      });
    });
    
    // Check for overlaps
    for (let i = 0; i < activeEvents.length; i++) {
      for (let j = i + 1; j < activeEvents.length; j++) {
        const event1 = activeEvents[i];
        const event2 = activeEvents[j];
        
        // Check if events are from different timelines and overlap
        if (event1.timelineIndex !== event2.timelineIndex) {
          const overlaps = 
            (event1.startTime < event2.endTime && event1.endTime > event2.startTime);
          
          if (overlaps) {
            // Mark both events as overlapping
            if (!overlappingEventsMap.has(event1.timelineIndex)) {
              overlappingEventsMap.set(event1.timelineIndex, new Set());
            }
            overlappingEventsMap.get(event1.timelineIndex)!.add(event1.eventIndex);
            
            if (!overlappingEventsMap.has(event2.timelineIndex)) {
              overlappingEventsMap.set(event2.timelineIndex, new Set());
            }
            overlappingEventsMap.get(event2.timelineIndex)!.add(event2.eventIndex);
          }
        }
      }
    }
  }
  
  return (
    <div className="w-full my-6 p-4 bg-slate-900 rounded-md border border-slate-800">
      <div className="flex flex-row justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Timelines</h3>
        <div 
          className="text-sm text-slate-300"
          aria-label={`Maximum duration: ${maxDurationText}`}
        >
          Max Duration: {maxDurationText}
        </div>
      </div>
      <div ref={containerRef}>
        {localTimelines.map((timeline, index) => (
          <TimelineRow
            key={index}
            timeline={timeline}
            scale={scale}
            onOffsetResize={(targetWidth) => handleOffsetResize(index, targetWidth)}
            onEventResize={(eventIndex, targetWidth) =>
              handleEventResize(index, eventIndex, targetWidth)
            }
            maxDuration={maxDuration}
            showOffset={showOffsets}
            overlappingEvents={overlappingEventsMap.get(index) || new Set()}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Drag the edges of {showOffsets ? "offsets and events" : "events"} to experiment with timing variations.
      </p>
    </div>
  );
}
