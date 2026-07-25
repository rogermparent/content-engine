/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Recipe } from "../../controller/types";

import { Badge } from "@discontent/component-library/components/ui/badge";
import Markdown from "@discontent/component-library/components/Markdown";
import { getTransformedRecipeImageProps } from "../RecipeImage";
import { MultipliedServings, MultiplierInput } from "./Multiplier";
import { InfoCard } from "./shared";
import { Instructions } from "./Instructions";
import { MultiplierProvider } from "./Multiplier/Provider";
import { VideoPlayerProvider } from "@discontent/component-library/components/VideoPlayer/Provider";
import { VideoPlayer } from "@discontent/component-library/components/VideoPlayer";
import { RecipeJsonLD } from "./JsonLD";
import { Ingredients } from "./Ingredients";
import { RecipeSchedule } from "./Schedule";
import BookmarkButton from "../BookmarkButton";
import { resolveRecipeVideoSrc } from "../../controller/recipeVideo";
import { formatDurationLong } from "../../util/formatDuration";

export async function RecipeView({
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
    timelines,
    date,
    tags,
  } = recipe;

  // Calculate the totalTime from prepTime and cookTime if not provided
  const totalTime = recipe.totalTime || (prepTime || 0) + (cookTime || 0);

  const recipeImageProps = image
    ? await getTransformedRecipeImageProps({
        slug: slug,
        image: image,
        alt: `Photo of ${name}`,
        width: 580,
        height: 450,
        sizes: "100vw",
        className: "object-cover absolute w-full h-full inset-0 rounded-md",
        loading: "eager",
      })
    : undefined;

  return (
    <MultiplierProvider>
      <VideoPlayerProvider>
        <RecipeJsonLD recipe={recipe} image={recipeImageProps?.props.src} />
        <div className="w-full h-full p-2 print:p-0 grow flex flex-col flex-nowrap">
          <div className="container mx-auto lg:flex lg:flex-row justify-center print:w-full print:max-w-full">
            <div className="aspect-[16/10] w-full lg:aspect-auto lg:h-96 lg:max-w-96 lg:mr-4 print:hidden relative">
              {recipeImageProps && (
                <img {...recipeImageProps.props} alt={`Photo of ${name}`} />
              )}
              {video && (
                <VideoPlayer
                  src={resolveRecipeVideoSrc(slug, video)}
                  className="object-cover absolute w-full h-full inset-0"
                />
              )}
            </div>
            <div className="flex-1 max-w-xl mx-auto lg:mx-0 print:max-w-full">
              <div className="flex flex-row items-start justify-between mt-4 mb-6">
                <h1 className="text-3xl font-bold mr-4">{name}</h1>
                <div className="print:hidden">
                  <BookmarkButton recipe={{ slug, date, name, image }} />
                </div>
              </div>
              {tags && tags.length > 0 && (
                <div
                  className="flex flex-row flex-wrap items-center gap-1.5 mb-4 print:hidden"
                  aria-label="Tags"
                >
                  {tags.map((tag) => (
                    <Badge key={tag} asChild variant="secondary">
                      <Link href={`/search?tags=${encodeURIComponent(tag)}`}>
                        {tag}
                      </Link>
                    </Badge>
                  ))}
                </div>
              )}
              {description && (
                <div className="my-2">
                  <Markdown>{description}</Markdown>
                </div>
              )}
              {prepTime || cookTime || totalTime ? (
                <div className="m-2 flex flex-row flex-wrap items-center justify-center gap-1">
                  <InfoCard title="Prep Time">
                    {formatDurationLong(prepTime)}
                  </InfoCard>
                  <InfoCard title="Cook Time">
                    {formatDurationLong(cookTime)}
                  </InfoCard>
                  <InfoCard title="Total Time">
                    {formatDurationLong(totalTime)}
                  </InfoCard>
                </div>
              ) : null}
            </div>
          </div>
          {timelines && timelines.length > 0 && (
            <RecipeSchedule timelines={timelines} />
          )}
          {/* Sticky scale bar — the recipe's two live controls (scale + yield)
              stay reachable while scrolling the ingredients and steps. Neither
              sticks nor prints on paper. */}
          <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur print:static print:hidden">
            <div className="container mx-auto flex flex-row flex-wrap items-center justify-center gap-2 px-2 py-1">
              <MultiplierInput />
              <MultipliedServings recipe={recipe} />
            </div>
          </div>
          <div className="justify-center flex-nowrap container mx-auto p-2 lg:flex lg:flex-row print:w-full print:max-w-full print:flex print:flex-row rounded">
            <Ingredients ingredients={ingredients} />
            <Instructions instructions={instructions} />
          </div>
        </div>
      </VideoPlayerProvider>
    </MultiplierProvider>
  );
}
