"use client";

import { VideoPlayer } from "component-library/components/VideoPlayer";
import { ReactNode, useState } from "react";
import clsx from "clsx";

export function StickyVideoPlayer({
  src,
  className,
  stickyClassName = "sticky top-0",
  nonStickyClassName = "relative",
  poster,
  children,
}: {
  src: string;
  className?: string;
  stickyClassName?: string;
  nonStickyClassName?: string;
  children?: ReactNode;
  poster?: string;
}) {
  const [sticky, setSticky] = useState(false);

  const stickyPositioning = sticky ? stickyClassName : nonStickyClassName;

  return (
    <div className={clsx(className, stickyPositioning)}>
      {children}
      {sticky && (
        <button
          type="button"
          className="top-0 left-0 absolute transition-all w-9 h-9 hover:w-10 hover:h-10 bg-white text-black rounded-br-lg opacity-50 text-2xl font-bold"
          onClick={() => {
            setSticky(false);
          }}
        >
          &times;
        </button>
      )}
      <VideoPlayer
        src={src}
        poster={poster}
        className="object-cover w-full h-full top-0"
        onPlaying={() => {
          setSticky(true);
        }}
      />
    </div>
  );
}
