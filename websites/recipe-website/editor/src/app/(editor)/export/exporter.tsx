"use client";

import {
  commandAction,
  StreamActionResult,
} from "@/app/(recipes)/scriptAction";
import { SubmitButton } from "component-library/components/SubmitButton";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { buildExport } from "./exportAction";

const decoder = new TextDecoder();

function OutputWindow({ children }: { children: ReactNode }) {
  return (
    <div className="my-1 text-sm rounded-lg bg-slate-700 overflow-auto h-96 w-full">
      <pre className="p-3 inline-block min-w-full">{children}</pre>
    </div>
  );
}

function useStreamText() {
  const [currentStream, setStreamResponse] = useState<StreamActionResult>();
  const [streamText, setStreamText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  useEffect(() => {
    if (currentStream) {
      if (typeof currentStream === "string") {
        setStreamText(currentStream);
      } else {
        setStreamText("");
        (async () => {
          const reader = currentStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              setIsRunning(false);
              return;
            }
            setStreamText((cur) => cur + decoder.decode(value));
          }
        })();
      }
    }
  }, [currentStream, setStreamText]);
  const fetchStream = useCallback(
    (streamAction: () => Promise<StreamActionResult>) => {
      setIsRunning(true);
      (typeof streamAction === "string"
        ? fetch(streamAction).then((res) => res?.body)
        : streamAction()
      )
        .then((res) => {
          if (res) {
            setStreamResponse(res);
          }
        })
        .catch(() => {
          setIsRunning(false);
        });
    },
    [],
  );
  return { streamText, isRunning, fetchStream };
}

function StreamActionLog({
  streamAction,
  buttonText,
}: {
  streamAction: () => Promise<StreamActionResult>;
  buttonText: string;
}) {
  const { streamText, isRunning, fetchStream } = useStreamText();
  return (
    <form
      action={streamAction}
      className="p-1 block"
      onSubmit={(e) => {
        e.preventDefault();
        fetchStream(streamAction);
      }}
    >
      <SubmitButton>{buttonText}</SubmitButton>
      {isRunning && (
        <>
          {" "}
          <i>running...</i>
        </>
      )}
      <OutputWindow>{streamText}</OutputWindow>
    </form>
  );
}

export function Exporters() {
  return (
    <div className="p-2 w-full">
      <StreamActionLog streamAction={buildExport} buttonText="Build" />
      <StreamActionLog
        streamAction={commandAction.bind(undefined, "deploy")}
        buttonText="Deploy"
      />
    </div>
  );
}
