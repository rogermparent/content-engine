import { migrateData } from "content-engine/content/migrate";
import { recipeContentConfig } from "recipe-website-common/controller/recipeContentConfig";
import { InstructionEntry } from "recipe-website-common/controller/types";

migrateData(recipeContentConfig, async (recipeData) => {
  const newData = {
    ...recipeData,
    instructions: recipeData.instructions?.reduce<InstructionEntry[]>(
      (acc, currentInstruction) => {
        if (
          "instructions" in currentInstruction &&
          currentInstruction.instructions
        ) {
          const newHeading = { type: "heading", name: currentInstruction.name };
          return acc.concat(
            newHeading as unknown as InstructionEntry,
            ...currentInstruction.instructions,
          );
        }
        return [...acc, currentInstruction];
      },
      [],
    ),
  };
  return newData;
});
