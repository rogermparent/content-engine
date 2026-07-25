"use client";

import { useState } from "react";
import { InstructionEntry } from "../../../controller/types";

import Markdown from "@discontent/component-library/components/Markdown";
import { Multiplyable } from "../Multiplier/Multiplyable";
import { VideoTime } from "./VideoTime";
import { Button } from "@discontent/component-library/components/ui/button";
import { Checkbox } from "@discontent/component-library/components/ui/checkbox";

const stepHeadingStyle = "text-lg font-bold my-2 border-b border-border";
const childHeadingStyle = "text-base font-bold my-1 border-b border-border";

export const InstructionEntryView = ({
  entry,
}: {
  entry: InstructionEntry;
}) => {
  if ("instructions" in entry) {
    const { name, instructions } = entry;
    return (
      <div className="my-3 list-none">
        {name && <h3 className={stepHeadingStyle}>{name}</h3>}
        <ol className="list-decimal pl-1 sm:pl-3 md:pl-4">
          {instructions.map(({ name, text }, i) => (
            <li key={i} className="my-2">
              {name && <h4 className={childHeadingStyle}>{name}</h4>}
              <label className="flex flex-row flex-nowrap items-center gap-2 print:h-auto">
                <Checkbox className="m-2 shrink-0" />
                <Markdown
                  components={{
                    Multiplyable: { component: Multiplyable },
                    VideoTime: { component: VideoTime },
                  }}
                >
                  {text}
                </Markdown>
              </label>
            </li>
          ))}
        </ol>
      </div>
    );
  } else {
    const { name, text } = entry;
    return (
      <div className="my-3">
        {name && <h3 className={stepHeadingStyle}>{name}</h3>}
        <label className="flex flex-row flex-nowrap items-center gap-2 print:h-auto">
          <Checkbox className="m-2 shrink-0" />
          <Markdown
            className={undefined}
            components={{
              Multiplyable: { component: Multiplyable },
              VideoTime: { component: VideoTime },
            }}
          >
            {text}
          </Markdown>
        </label>
      </div>
    );
  }
};

export function Instructions({
  instructions,
}: {
  instructions: InstructionEntry[] | undefined;
}) {
  // Reset clears the checklist by remounting the list (see Ingredients).
  const [resetKey, setResetKey] = useState(0);

  return (
    instructions && (
      <section className="max-w-xl mx-auto lg:mx-0 print:w-full print:max-w-full bg-card rounded-md px-4 grow-1 h-auto py-1 mb-2">
        <h2 className="text-xl font-bold flex flex-row flex-nowrap items-center">
          Instructions
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="ml-2 print:hidden"
            onClick={() => setResetKey((k) => k + 1)}
          >
            Reset
          </Button>
        </h2>
        <ol key={resetKey} className="list-decimal pl-4">
          {instructions.map((entry, i) => (
            <li key={i}>
              <InstructionEntryView entry={entry} />
            </li>
          ))}
        </ol>
      </section>
    )
  );
}
