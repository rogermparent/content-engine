import {
  Instruction,
  InstructionEntry,
  InstructionHeading,
} from "../../../controller/types";

import Markdown from "component-library/components/Markdown";
import { Multiplyable } from "../Multiplier/Multiplyable";
import { VideoTime } from "./VideoTime";
import { PaddedButton } from "component-library/components/Button";

const stepHeadingStyle = "text-lg font-bold my-2 border-b border-white";

export const InstructionEntryView = ({
  entry,
}: {
  entry: InstructionEntry;
}) => {
  if ("type" in entry) {
    if (entry.type === "heading") {
      const { name } = entry;
      return (
        <div className="my-3">
          <h3 className={stepHeadingStyle}>{name}</h3>
        </div>
      );
    }
  }

  const { name, text } = entry as Instruction;
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
};

interface InstructionGroup {
  heading?: InstructionHeading;
  instructions: Instruction[];
}

function groupInstructions(
  instructions: InstructionEntry[],
): InstructionGroup[] {
  const groups: InstructionGroup[] = [];
  let currentGroup: InstructionGroup = { instructions: [] };
  for (const instruction of instructions) {
    const isHeading = "type" in instruction && instruction.type === "heading";
    if (isHeading) {
      groups.push(currentGroup);
      currentGroup = {
        heading: instruction as InstructionHeading,
        instructions: [],
      };
    } else {
      currentGroup.instructions.push(instruction as Instruction);
    }
  }
  groups.push(currentGroup);
  return groups;
}

export function Instructions({
  instructions,
}: {
  instructions: InstructionEntry[] | undefined;
}) {
  const groups = instructions && groupInstructions(instructions);
  return (
    instructions && (
      <form className="max-w-xl mx-auto lg:mx-0 print:w-full print:max-w-full bg-slate-800 rounded-md px-4 grow-1 h-auto py-1 mb-2">
        <h2 className="text-xl font-bold flex flex-row flex-nowrap items-center">
          Instructions
          <PaddedButton
            className="ml-2 h-12 text-base print:hidden"
            type="reset"
          >
            Reset
          </PaddedButton>
        </h2>
        <ul>
          {groups?.map(({ heading, instructions }, i) => {
            return (
              <li key={i} className="list-none">
                {heading && <InstructionEntryView entry={heading} />}
                <ol className="list-decimal pl-4">
                  {instructions.map((entry, j) => (
                    <li key={j}>
                      <InstructionEntryView entry={entry} />
                    </li>
                  ))}
                </ol>
              </li>
            );
          }) || null}
        </ul>
      </form>
    )
  );
}
