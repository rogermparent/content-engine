"use client";

import { useCallback, useEffect, ReactEventHandler } from "react";
import { useVideoPlayer } from "./Provider";

export function VideoPlayer({
  src,
  className,
  controls = true,
  poster = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  onPlaying,
}: {
  src: string;
  className?: string;
  controls?: boolean;
  poster?: string;
  onPlaying?: ReactEventHandler<HTMLVideoElement>;
}) {
  const [{ video, startTime, needsReset }, dispatch] = useVideoPlayer();
  useEffect(() => {
    if (needsReset && video) {
      const enforcedStartTime = startTime || 0;
      video.currentTime = enforcedStartTime;
      video.play();
      if (enforcedStartTime && video.currentTime >= enforcedStartTime) {
        dispatch({ type: "CONFIRM_RESET" });
      }
    }
  }, [startTime, video, needsReset, dispatch]);
  const refCallback = useCallback(
    (element: HTMLVideoElement | null) => {
      dispatch({ type: "SET_VIDEO_ELEMENT", element });
    },
    [dispatch],
  );
  return (
    <video
      src={src}
      className={className}
      poster={poster}
      controls={controls}
      ref={refCallback}
      onPlaying={onPlaying}
    />
  );
}
