"use client";

import { useCallback, ReactEventHandler } from "react";
import { useVideoPlayer } from "./Provider";
import ReactPlayer from "react-player";

export function VideoPlayer({
  src,
  className,
  controls = true,
  poster = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
}: {
  src: string;
  className?: string;
  controls?: boolean;
  poster?: string;
}) {
  const [_state, dispatch] = useVideoPlayer();
  const refCallback = useCallback(
    (element: HTMLVideoElement | null) => {
      dispatch({ type: "SET_VIDEO_ELEMENT", element });
    },
    [dispatch],
  );
  return (
    <ReactPlayer
      src={src}
      className={className}
      poster={poster}
      controls={controls}
      ref={refCallback}
      style={{ width: "100%", height: "100%", aspectRatio: "16/9" }}
    />
  );
}
