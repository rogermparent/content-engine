"use client";

import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import { ImportedRecipe } from "recipe-website-common/util/importRecipeData";
import { resolveRecipeVideoSrc } from "recipe-website-common/controller/recipeVideo";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import { useRecipeForm } from "./formContext";
import { mergeFieldErrors } from "./fieldErrors";
import { IngredientsListInput } from "recipe-website-common/components/Form/Ingredients";
import { InstructionsListInput } from "recipe-website-common/components/Form/Instructions";
import { TimelinesInput } from "recipe-website-common/components/Form/Timeline";
import { DateTimeInput } from "@discontent/component-library/components/Form/inputs/DateTime";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";
import { LexicalMarkdownInput } from "@discontent/component-library/components/Form/inputs/LexicalMarkdown";
import { ImageInput } from "./Image";
import { VideoInput } from "@discontent/component-library/components/Form/inputs/Video";
import { StaticImageProps } from "@discontent/next-static-image/src";
import { VideoPlayerProvider } from "@discontent/component-library/components/VideoPlayer/Provider";
import { DurationInput } from "@discontent/component-library/components/Form/inputs/Duration";
import { useCurrentTimezone } from "@discontent/cms/hooks/useCurrentTimezone";

import { yieldToolbarItems } from "./RecipeMarkdown/lexicalToolbar";

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
  const form = useRecipeForm();
  // Read the live name reactively (drives the slug placeholder) without nesting
  // the slug field inside a form.Subscribe, which broke the slug field's
  // controlled value at submit time.
  const currentName = useStore(form.store, (s) => s.values.name);
  const {
    date,
    timelines,
    imageImportUrl,
    videoImportUrl,
    video,
    prepTime,
    cookTime,
    totalTime,
  } = recipe || {};

  const currentTimezone = useCurrentTimezone();

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

  const totalTimeHours = (prepTimeHours || 0) + (cookTimeHours || 0);
  const totalTimeMinutes = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);
  const totalTimePreview = totalTimeHours * 60 + totalTimeMinutes;

  return (
    <VideoPlayerProvider>
      <form.Field
        name="name"
        validators={{
          onBlur: ({ value }) =>
            !value?.trim() ? "Name is required" : undefined,
        }}
      >
        {(field) => (
          <TextInput
            label="Name"
            name="name"
            id="recipe-form-name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            errors={mergeFieldErrors(
              state?.errors?.name,
              field.state.meta.errors,
            )}
          />
        )}
      </form.Field>
      <form.Field name="description">
        {(field) => (
          <LexicalMarkdownInput
            label="Description"
            name="description"
            id="recipe-form-description"
            value={field.state.value}
            onChange={field.handleChange}
            errors={mergeFieldErrors(
              state?.errors?.description,
              field.state.meta.errors,
            )}
          />
        )}
      </form.Field>
      <ImageInput
        defaultImage={defaultImage}
        errors={state?.errors?.image}
        imageToImport={imageImportUrl}
      />
      <VideoInput
        label="Video"
        name="video"
        defaultVideo={resolveRecipeVideoSrc(slug, video)}
        videoToImport={videoImportUrl}
      />
      <form.Field name="recipeYield">
        {(field) => (
          <LexicalMarkdownInput
            label="Yield"
            name="recipeYield"
            id="recipe-form-yield"
            value={field.state.value}
            onChange={field.handleChange}
            errors={mergeFieldErrors(
              state?.errors?.recipeYield,
              field.state.meta.errors,
            )}
            toolbarItems={yieldToolbarItems}
            compact
          />
        )}
      </form.Field>
      <IngredientsListInput label="Ingredients" id="recipe-form-ingredients" />
      <InstructionsListInput
        label="Instructions"
        id="recipe-form-instructions"
      />
      <TimelinesInput
        label="Timelines"
        name="timelines"
        id="recipe-form-timelines"
        defaultValue={timelines}
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
          <form.Field name="slug">
            {(field) => (
              <TextInput
                label="Slug"
                name="slug"
                id="recipe-form-slug"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={
                  currentName ? createDefaultSlug({ name: currentName }) : ""
                }
                errors={mergeFieldErrors(
                  state?.errors?.slug,
                  field.state.meta.errors,
                )}
              />
            )}
          </form.Field>
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
