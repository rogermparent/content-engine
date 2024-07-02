"use client";

import { useVideoPlayer } from "component-library/components/VideoPlayer/Provider";
import { ReactNode } from "react";

export function VideoTime({
  children,
  time,
}: {
  children?: ReactNode;
  time: number;
}) {
  const [_state, dispatch] = useVideoPlayer();
  return (
    <button
      type="button"
      className="underline cursor-pointer"
      onClick={() => {
        dispatch({ type: "SET_VIDEO_TIME", time });
      }}
    >
      {children}
    </button>
  );
}
