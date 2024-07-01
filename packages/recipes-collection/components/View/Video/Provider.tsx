"use client";

import React, { ReactNode, Reducer, useReducer } from "react";

interface VideoPlayerState {
  video?: HTMLVideoElement | null;
  startTime?: number;
  needsReset: boolean;
}

type VideoPlayerAction =
  | { type: "SET_VIDEO_ELEMENT"; element: HTMLVideoElement | null }
  | { type: "SET_VIDEO_TIME"; time: number }
  | { type: "CONFIRM_RESET" };

const VideoPlayerContext = React.createContext<
  [VideoPlayerState, React.Dispatch<VideoPlayerAction>] | undefined
>(undefined);

const videoPlayerReducer: Reducer<VideoPlayerState, VideoPlayerAction> = (
  state,
  action,
) => {
  switch (action.type) {
    case "SET_VIDEO_ELEMENT": {
      return { ...state, video: action.element, needsReset: false };
    }
    case "SET_VIDEO_TIME": {
      return { ...state, startTime: action.time, needsReset: true };
    }
    case "CONFIRM_RESET": {
      return { ...state, needsReset: false };
    }
    default:
      return state;
  }
};

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [videoPlayerState, setVideoPlayer] = useReducer(videoPlayerReducer, {
    needsReset: false,
  });

  return (
    <VideoPlayerContext.Provider value={[videoPlayerState, setVideoPlayer]}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = React.useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider");
  }
  return context;
}
