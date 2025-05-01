"use client";

import { useEffect, useMemo, useState } from "react";
import slugify from "@sindresorhus/slugify";
import { ImportedRecipe } from "recipe-website-common/util/importRecipeData";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import createDefaultSlug from "recipe-website-common/controller/createSlug";
import { IngredientsListInput } from "recipe-website-common/components/Form/Ingredients";
import { InstructionsListInput } from "recipe-website-common/components/Form/Instructions";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";
import { ImageInput } from "./Image";
import { VideoInput } from "component-library/components/Form/inputs/Video";
import { StaticImageProps } from "next-static-image/src";
import { VideoPlayerProvider } from "component-library/components/VideoPlayer/Provider";
import { DurationInput } from "component-library/components/Form/inputs/Duration";
export default function RecipeFields({
  recipe,
  slug,
  state,
  defaultImage,
}: {
  recipe?: Partial<ImportedRecipe>;
  slug?: string;
  state: RecipeFormState;
  defaultImage?: StaticImageProps;
}) {
  const {
    name,
    date,
    description,
    ingredients,
    instructions,
    imageImportUrl,
    video,
    prepTime,
    cookTime,
    totalTime,
  } = recipe || {};
  const [currentName, setCurrentName] = useState(name);
  const defaultSlug = useMemo(
    () => slugify(createDefaultSlug({ name: currentName || "" })),
    [currentName],
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
        errors={state.errors?.name}
      />
      <MarkdownInput
        label="Description"
        name="description"
        id="recipe-form-description"
        defaultValue={description}
        errors={state.errors?.description}
      />
      <ImageInput
        defaultImage={defaultImage}
        errors={state.errors?.image}
        imageToImport={imageImportUrl}
      />
      <VideoInput
        label="Video"
        name="video"
        defaultVideo={video && `/uploads/recipe/${slug}/uploads/${video}`}
      />
      <IngredientsListInput
        label="Ingredients"
        name="ingredients"
        id="recipe-form-ingredients"
        defaultValue={ingredients}
        errors={state.errors}
      />
      <InstructionsListInput
        label="Instructions"
        name="instructions"
        id="recipe-form-instructions"
        defaultValue={instructions}
        errors={state.errors}
      />
      <div className="flex flex-row flex-wrap gap-2 justify-around items-center">
        <DurationInput
          label="Prep Time"
          name="prepTime"
          id="recipe-form-prep-time"
          defaultValue={prepTime}
          errors={state.errors?.prepTime}
          onHoursChange={(e) => setPrepTimeHours(Number(e.target.value))}
          onMinutesChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
        />
        <DurationInput
          label="Cook Time"
          name="cookTime"
          id="recipe-form-cook-time"
          defaultValue={cookTime}
          errors={state.errors?.cookTime}
          onHoursChange={(e) => setCookTimeHours(Number(e.target.value))}
          onMinutesChange={(e) => setCookTimeMinutes(Number(e.target.value))}
        />
        <DurationInput
          label="Total Time"
          name="totalTime"
          id="recipe-form-total-time"
          defaultValue={totalTime}
          errors={state.errors?.totalTime}
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
            placeholder={defaultSlug}
            errors={state.errors?.slug}
          />
          <DateTimeInput
            label="Date (UTC)"
            name="date"
            id="recipe-form-date"
            date={date}
            currentTimezone={currentTimezone}
            errors={state.errors?.date}
          />
        </div>
      </details>
    </VideoPlayerProvider>
  );
}
