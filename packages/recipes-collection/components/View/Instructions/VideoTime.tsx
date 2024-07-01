"use client";

import { ReactNode } from "react";
import { useVideoPlayer } from "../Video/Provider";

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
