"use client";

import { useEffect, useReducer, useState } from "react";
import { ImportedRecipe } from "recipe-website-common/util/importRecipeData";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import { IngredientsListInput } from "recipe-website-common/components/Form/Ingredients";
import { InstructionsListInput } from "recipe-website-common/components/Form/Instructions";
import { TimelineListInput } from "recipe-website-common/components/Form/Timeline";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";
import { InlineMarkdownInput } from "component-library/components/Form/inputs/Markdown/Inline";
import { ImageInput } from "./Image";
import { VideoInput } from "component-library/components/Form/inputs/Video";
import { StaticImageProps } from "next-static-image/src";
import { VideoPlayerProvider } from "component-library/components/VideoPlayer/Provider";
import { DurationInput } from "component-library/components/Form/inputs/Duration";

import { DummyMultiplyable, YieldControls } from "./RecipeMarkdown";

interface DefaultNameState {
  currentName?: string;
  defaultSlug?: string;
}

function reduceDefaultSlug(
  _state: DefaultNameState,
  name: string,
): DefaultNameState {
  return {
    currentName: name,
    defaultSlug: name ? createDefaultSlug({ name }) : "",
  };
}

export default function RecipeFields({
  recipe,
  slug,
  state,
  defaultImage,
}: {
  recipe?: Partial<ImportedRecipe>;
  slug?: string;
  state?: RecipeFormState;
  defaultImage?: StaticImageProps;
}) {
  const {
    name,
    date,
    description,
    ingredients,
    instructions,
    timeline,
    imageImportUrl,
    video,
    prepTime,
    cookTime,
    totalTime,
    recipeYield,
  } = recipe || {};
  const initialDefaultSlug = name && createDefaultSlug({ name });
  const [{ currentName, defaultSlug }, setCurrentName] = useReducer(
    reduceDefaultSlug,
    {
      currentName: name,
      defaultSlug: undefined,
    },
  );

  const [currentTimezone, setCurrentTimezone] = useState<string>();

  useEffect(() => {
    const fetchedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setCurrentTimezone(fetchedTimezone);
  }, []);

  const [prepTimeHours, setPrepTimeHours] = useState<number>(
    prepTime ? Math.floor(prepTime / 60) : 0,
  );
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(
    prepTime ? prepTime % 60 : 0,
  );
  const [cookTimeHours, setCookTimeHours] = useState<number>(
    cookTime ? Math.floor(cookTime / 60) : 0,
  );
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(
    cookTime ? cookTime % 60 : 0,
  );

  // Reset preview if the provided recipe changes
  useEffect(() => {
    setPrepTimeHours(prepTime ? Math.floor(prepTime / 60) : 0);
    setPrepTimeMinutes(prepTime ? prepTime % 60 : 0);
    setCookTimeHours(cookTime ? Math.floor(cookTime / 60) : 0);
    setCookTimeMinutes(cookTime ? cookTime % 60 : 0);
  }, [recipe]);

  const totalTimeHours = (prepTimeHours || 0) + (cookTimeHours || 0);
  const totalTimeMinutes = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);
  const totalTimePreview = totalTimeHours * 60 + totalTimeMinutes;

  return (
    <VideoPlayerProvider>
      <TextInput
        label="Name"
        name="name"
        id="recipe-form-name"
        defaultValue={name}
        onChange={(e) => setCurrentName(e.target.value)}
        errors={state?.errors?.name}
      />
      <MarkdownInput
        label="Description"
        name="description"
        id="recipe-form-description"
        defaultValue={description}
        errors={state?.errors?.description}
      />
      <ImageInput
        defaultImage={defaultImage}
        errors={state?.errors?.image}
        imageToImport={imageImportUrl}
      />
      <VideoInput
        label="Video"
        name="video"
        defaultVideo={video && `/uploads/recipe/${slug}/uploads/${video}`}
      />
      <InlineMarkdownInput
        label="Yield"
        name="recipeYield"
        id="recipe-form-yield"
        defaultValue={recipeYield}
        errors={state?.errors?.recipeYield}
        Controls={YieldControls}
        components={{
          Multiplyable: DummyMultiplyable,
        }}
      />
      <IngredientsListInput
        label="Ingredients"
        name="ingredients"
        id="recipe-form-ingredients"
        defaultValue={ingredients}
        errors={state?.errors}
      />
      <InstructionsListInput
        label="Instructions"
        name="instructions"
        id="recipe-form-instructions"
        defaultValue={instructions}
        errors={state?.errors}
      />
      <TimelineListInput
        label="Timeline"
        name="timeline"
        id="recipe-form-timeline"
        defaultValue={timeline}
        errors={state?.errors}
      />
      <div className="flex flex-row flex-wrap gap-2 justify-around items-center">
        <DurationInput
          label="Prep Time"
          name="prepTime"
          id="recipe-form-prep-time"
          defaultValue={prepTime}
          errors={state?.errors?.prepTime}
          onHoursChange={(e) => setPrepTimeHours(Number(e.target.value))}
          onMinutesChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
        />
        <DurationInput
          label="Cook Time"
          name="cookTime"
          id="recipe-form-cook-time"
          defaultValue={cookTime}
          errors={state?.errors?.cookTime}
          onHoursChange={(e) => setCookTimeHours(Number(e.target.value))}
          onMinutesChange={(e) => setCookTimeMinutes(Number(e.target.value))}
        />
        <DurationInput
          label="Total Time"
          name="totalTime"
          id="recipe-form-total-time"
          defaultValue={totalTime}
          errors={state?.errors?.totalTime}
          placeholder={totalTimePreview}
        />
      </div>
      <details className="py-1 my-1" open>
        <summary className="text-sm font-semibold">Advanced</summary>
        <div className="flex flex-col flex-nowrap">
          <TextInput
            label="Slug"
            name="slug"
            id="recipe-form-slug"
            defaultValue={slug}
            placeholder={
              defaultSlug === undefined ? initialDefaultSlug : defaultSlug
            }
            errors={state?.errors?.slug}
          />
          <DateTimeInput
            label="Date (UTC)"
            name="date"
            id="recipe-form-date"
            date={date}
            currentTimezone={currentTimezone}
            errors={state?.errors?.date}
          />
        </div>
      </details>
    </VideoPlayerProvider>
  );
}
