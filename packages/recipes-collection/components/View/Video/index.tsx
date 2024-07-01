"use client";

import { useCallback, useEffect } from "react";
import { useVideoPlayer } from "./Provider";

export function Video({
  src,
  className,
  controls = true,
}: {
  src: string;
  className?: string;
  controls?: boolean;
}) {
  const [{ video, startTime, needsReset }, dispatch] = useVideoPlayer();
  useEffect(() => {
    if (needsReset && video) {
      video.currentTime = startTime || 0;
      video.play();
      dispatch({ type: "CONFIRM_RESET" });
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
      poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      controls={controls}
      ref={refCallback}
    />
  );
}
