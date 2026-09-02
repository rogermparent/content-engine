"use client";

import { useEffect, useId, useState } from "react";
import {
  $createTextNode,
  $getNodeByKey,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@discontent/component-library/components/ui/popover";
import { Button } from "@discontent/component-library/components/ui/button";
import { Input } from "@discontent/component-library/components/ui/input";
import {
  formatSeconds,
  parseTimeLabel,
} from "@discontent/component-library/lib/videoTime";
import { cn } from "@discontent/component-library/lib/utils";
import { $isVideoTimeNode } from "./nodes";

export interface VideoTimeChipProps {
  editor: LexicalEditor;
  nodeKey: NodeKey;
  label: string;
  time: number | null;
  autoEdit: boolean;
}

/**
 * The in-editor face of a VideoTimeNode: an inline chip showing the label and
 * the seconds it resolves to, with a popover for editing both — so a
 * timestamp never requires a trip to Source mode. The custom-seconds field is
 * only stored when it differs from what the label already parses to, keeping
 * the exported tag attribute-less in the common case.
 */
export function VideoTimeChip({
  editor,
  nodeKey,
  label,
  time,
  autoEdit,
}: VideoTimeChipProps) {
  const [open, setOpen] = useState(autoEdit);
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftTime, setDraftTime] = useState(time === null ? "" : String(time));
  const hintId = useId();

  // autoEdit is a one-shot hint from the toolbar; clear it on the node once
  // consumed so a later remount (e.g. mode toggle) doesn't reopen the popover.
  useEffect(() => {
    if (autoEdit) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isVideoTimeNode(node)) node.setAutoEdit(false);
      });
    }
  }, [autoEdit, editor, nodeKey]);

  const effectiveTime = time ?? parseTimeLabel(label);
  const draftDerived = parseTimeLabel(draftLabel);

  const openWithFreshDraft = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftLabel(label);
      setDraftTime(time === null ? "" : String(time));
    }
    setOpen(nextOpen);
  };

  const apply = () => {
    const custom = draftTime.trim() === "" ? null : Number(draftTime);
    const normalized =
      custom === null || Number.isNaN(custom) || custom === draftDerived
        ? null
        : custom;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isVideoTimeNode(node)) {
        node.setLabel(draftLabel);
        node.setTime(normalized);
      }
    });
    setOpen(false);
  };

  const remove = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isVideoTimeNode(node)) node.replace($createTextNode(label));
    });
  };

  return (
    <Popover open={open} onOpenChange={openWithFreshDraft}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-lexical-video-time={effectiveTime ?? ""}
          // Keep Lexical's selection handling from swallowing the click.
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "inline items-baseline underline decoration-dotted",
            effectiveTime === null && "text-destructive",
          )}
          title={
            effectiveTime === null
              ? "Video time: no time set"
              : `Video time: ${effectiveTime}s`
          }
        >
          <span aria-hidden className="mr-0.5 text-xs">
            &#9202;
          </span>
          {label}
          <span
            className={cn(
              "ml-1 rounded-xs px-1 text-xs",
              effectiveTime === null
                ? "border border-destructive"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {effectiveTime === null ? "no time" : formatSeconds(effectiveTime)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Label
          <Input
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            aria-describedby={hintId}
            autoFocus
          />
        </label>
        <p id={hintId} className="text-xs text-muted-foreground">
          {draftDerived === null
            ? "No time — set custom seconds"
            : `Jumps to: ${formatSeconds(draftDerived)}`}
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Custom time (seconds)
          <Input
            type="number"
            min={0}
            step="any"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            placeholder={draftDerived === null ? "" : String(draftDerived)}
          />
        </label>
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={remove}
          >
            Remove
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
