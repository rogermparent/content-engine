"use client";

import { useOptionalVideoPlayer } from "@discontent/component-library/components/VideoPlayer/Provider";
import { parseTimeLabel } from "@discontent/component-library/lib/videoTime";
import { ReactNode } from "react";

/** The plain text of the tag's children — the label readers see. */
function flattenChildrenText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenChildrenText).join("");
  }
  if (typeof node === "object" && "props" in node) {
    return flattenChildrenText(
      (node.props as { children?: ReactNode }).children,
    );
  }
  return "";
}

/**
 * A clickable video timestamp. The label is the source of truth: with no
 * `time` prop the seconds are parsed from the visible text
 * (`<VideoTime>3:37</VideoTime>`). An explicit `time` is an override for
 * labels that aren't themselves times.
 *
 * `time` also accepts a string because markdown-to-jsx passes `time={217}`
 * through as the string "217".
 *
 * Degrades to an inert span when there is no VideoPlayerProvider above it
 * (homepage hero, featured notes, form previews) or no derivable time (the
 * legacy broken `time={}` with a prose label must not seek to 0).
 */
export function VideoTime({
  children,
  time,
}: {
  children?: ReactNode;
  time?: number | string;
}) {
  const player = useOptionalVideoPlayer();

  const explicit =
    time !== undefined && String(time).trim() !== "" ? Number(time) : null;
  const seconds =
    explicit !== null && !Number.isNaN(explicit)
      ? explicit
      : parseTimeLabel(flattenChildrenText(children));

  if (player === undefined || seconds === null) {
    return <span>{children}</span>;
  }

  const [, dispatch] = player;
  return (
    <span
      className="underline cursor-pointer"
      onClick={() => {
        dispatch({ type: "SET_VIDEO_TIME", time: seconds });
      }}
    >
      {children}
    </span>
  );
}
