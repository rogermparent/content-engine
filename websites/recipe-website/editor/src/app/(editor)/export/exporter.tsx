"use client";

import { SubmitButton } from "component-library/components/SubmitButton";
import { ReactNode, useCallback, useEffect, useState } from "react";

const decoder = new TextDecoder();

function OutputWindow({ children }: { children: ReactNode }) {
  return (
    <div className="my-1 text-sm rounded-lg bg-slate-700 overflow-auto h-96 w-full">
      <pre className="p-3 inline-block min-w-full">{children}</pre>
    </div>
  );
}

function useStreamText(): {
  streamText: string;
  isRunning: boolean;
  fetchStream: (endpoint: string) => void;
} {
  const [streamResponse, setStreamResponse] = useState<Response>();
  const [streamText, setStreamText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  useEffect(() => {
    if (streamResponse?.body) {
      setStreamText("");
      const { body } = streamResponse;

      (async () => {
        const reader = body.getReader();
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
  }, [streamResponse, setStreamText]);
  const fetchStream = useCallback((endpoint: string) => {
    setIsRunning(true);
    fetch(endpoint)
      .then((res) => {
        setStreamResponse(res);
      })
      .catch(() => {
        setIsRunning(false);
      });
  }, []);
  return { streamText, isRunning, fetchStream };
}

function SingleExporter({
  endpoint,
  buttonText,
}: {
  endpoint: string;
  buttonText: string;
}) {
  const { streamText, isRunning, fetchStream } = useStreamText();
  return (
    <form
      action={endpoint}
      className="p-1 block"
      onSubmit={(e) => {
        e.preventDefault();
        fetchStream(endpoint);
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
      <SingleExporter endpoint="/build" buttonText="Build" />
      <SingleExporter endpoint="/deploy" buttonText="Deploy" />
    </div>
  );
}
