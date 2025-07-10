import { InstructionEntry } from "../../../controller/types";

import Markdown from "component-library/components/Markdown";
import { Multiplyable } from "../Multiplier/Multiplyable";
import { VideoTime } from "./VideoTime";
import { PaddedButton } from "component-library/components/Button";

const stepHeadingStyle = "text-lg font-bold my-2 border-b border-white";
const childHeadingStyle = "text-base font-bold my-1 border-b border-white";

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
              <label className="block flex flex-row flex-nowrap items-center print:h-auto">
                <input
                  type="checkbox"
                  className="h-4 w-4 m-2 inline-block shrink-0 rounded-xs border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
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
        <label className="block flex flex-row flex-nowrap items-center print:h-auto">
          <input
            type="checkbox"
            className="h-4 w-4 m-2 inline-block shrink-0 rounded-xs border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
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
  return (
    instructions && (
      <form className="max-w-prose mx-auto lg:mx-0 print:w-full print:max-w-full bg-slate-800 rounded-md px-4 grow-1 h-auto py-1 mb-2">
        <h2 className="text-xl font-bold flex flex-row flex-nowrap items-center">
          Instructions
          <PaddedButton
            className="ml-2 h-12 text-base print:hidden"
            type="reset"
          >
            Reset
          </PaddedButton>
        </h2>
        <ol className="list-decimal pl-4">
          {instructions.map((entry, i) => (
            <li key={i}>
              <InstructionEntryView entry={entry} />
            </li>
          ))}
        </ol>
      </form>
    )
  );
}
