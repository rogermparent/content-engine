import { InstructionEntry } from "../../../controller/types";

import Markdown from "component-library/components/Markdown";
import { Multiplyable } from "../Multiplier/Multiplyable";
import { VideoTime } from "./VideoTime";

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
      <li className="my-3 list-none">
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
      </li>
    );
  } else {
    const { name, text } = entry;
    return (
      <li className="my-3">
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
      </li>
    );
  }
};
