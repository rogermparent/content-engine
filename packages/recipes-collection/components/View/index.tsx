import { Recipe } from "../../controller/types";

import Markdown from "component-library/components/Markdown";
import { RecipeImage } from "../RecipeImage";
import { Ingredients, MultipliedServings, MultiplierInput } from "./Multiplier";
import { InfoCard } from "./shared";
import { InstructionEntryView } from "./Instructions";
import { MultiplierProvider } from "./Multiplier/Provider";
import { Video } from "./Video";
import { VideoPlayerProvider } from "./Video/Provider";

export function RecipeView({
  recipe,
  slug,
}: {
  recipe?: Recipe;
  slug: string;
}) {
  if (!recipe) {
    throw new Error("Recipe data not found!");
  }

  const {
    name,
    prepTime,
    cookTime,
    description,
    image,
    instructions,
    ingredients,
    video,
  } = recipe;

  // Calculate the totalTime from prepTime and cookTime
  const totalTime = (prepTime || 0) + (cookTime || 0);

  return (
    <MultiplierProvider>
      <VideoPlayerProvider>
        <div className="w-full h-full p-2 print:p-0 grow flex flex-col flex-nowrap">
          <div className="container mx-auto lg:flex lg:flex-row justify-center print:w-full print:max-w-full">
            <div className="aspect-ratio-[16/10] w-full h-96 lg:max-w-96 lg:mr-4 print:hidden relative">
              {image && (
                <RecipeImage
                  slug={slug}
                  image={image}
                  alt="Heading image"
                  width={580}
                  height={450}
                  sizes="100vw"
                  className="object-cover absolute w-full h-full inset-0"
                  loading="eager"
                />
              )}
              {video && (
                <Video
                  src={`/recipe/${slug}/uploads/${video}`}
                  className="object-cover absolute w-full h-full inset-0"
                />
              )}
            </div>
            <div className="flex-1 max-w-prose mx-auto lg:mx-0 print:max-w-full">
              <h1 className="text-3xl font-bold mt-4 mb-6">{name}</h1>
              {description && (
                <div className="my-2">
                  <Markdown>{description}</Markdown>
                </div>
              )}
              <div className="m-2 flex flex-row flex-wrap items-center justify-center">
                <MultiplierInput />
                <MultipliedServings recipe={recipe} />
                {prepTime && <InfoCard title="Prep Time">{prepTime}</InfoCard>}
                {cookTime && <InfoCard title="Cook Time">{cookTime}</InfoCard>}
                {totalTime ? (
                  <InfoCard title="Total Time">{totalTime.toString()}</InfoCard>
                ) : null}
              </div>
            </div>
          </div>
          <div className="justify-center flex-nowrap container mx-auto p-2 lg:flex lg:flex-row print:w-full print:max-w-full print:flex print:flex-row">
            <Ingredients ingredients={ingredients} />
            {instructions && (
              <div className="max-w-prose mx-auto lg:mx-0 print:w-full print:max-w-full">
                <h2 className="text-xl font-bold my-3">Instructions</h2>
                <ol className="list-decimal pl-4">
                  {instructions.map((entry, i) => (
                    <InstructionEntryView key={i} entry={entry} />
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </VideoPlayerProvider>
    </MultiplierProvider>
  );
}
