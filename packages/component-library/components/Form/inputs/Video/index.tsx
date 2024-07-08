"use client";

import { useEffect, useRef, useState } from "react";
import { FileInput } from "../File";
import { CheckboxInput } from "../Checkbox";
import { StickyVideoPlayer } from "../../../StickyVideoPlayer";

export function VideoInput({
  defaultVideo,
  errors,
  label,
  name,
  id,
  clearVideoName = "clearVideo",
}: {
  defaultVideo?: string;
  errors?: string[] | undefined;
  videoToImport?: string;
  label: string;
  name: string;
  clearVideoName?: string;
  id?: string;
}) {
  const [videoPreviewURL, setVideoPreviewURL] = useState<string>();

  useEffect(() => {
    if (videoPreviewURL) {
      return () => {
        URL.revokeObjectURL(videoPreviewURL);
      };
    }
  }, [videoPreviewURL]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <FileInput
        label={label}
        name={name}
        id={id}
        errors={errors}
        ref={fileInputRef}
        onChange={(e) => {
          const videosToUpload = e.target?.files;
          if (!videosToUpload) {
            return;
          }
          const previewVideo = videosToUpload[0];
          if (!previewVideo) {
            return;
          }
          const previewURL = URL.createObjectURL(previewVideo);
          setVideoPreviewURL(previewURL);
        }}
      />
      {videoPreviewURL ? (
        <>
          <StickyVideoPlayer
            src={videoPreviewURL}
            className="w-full"
            poster=""
          />
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
                setVideoPreviewURL(undefined);
              }
            }}
          >
            Cancel upload
          </button>
        </>
      ) : defaultVideo ? (
        <StickyVideoPlayer src={defaultVideo} className="w-full" poster="" />
      ) : null}
      {defaultVideo ? (
        <CheckboxInput name={clearVideoName} label="Remove Video" />
      ) : null}
    </>
  );
}
