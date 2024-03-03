"use client";

import { useEffect, useMemo, useState } from "react";
import slugify from "@sindresorhus/slugify";
import { Recipe } from "../../controller/types";
import { RecipeFormState } from "../../controller/formState";
import createDefaultSlug from "../../controller/createSlug";
import { IngredientsListInput } from "../../components/Form/Ingredients";
import { InstructionsListInput } from "../../components/Form/Instructions";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { TextAreaInput } from "component-library/components/Form/inputs/TextArea";
import { ImageInput } from "./Image";
import { StaticImageProps } from "../RecipeImage";

export default function RecipeFields({
  recipe,
  slug,
  state,
  defaultImage,
}: {
  recipe?: Partial<Recipe>;
  slug?: string;
  state: RecipeFormState;
  defaultImage?: StaticImageProps;
}) {
  const { name, date, description, ingredients, instructions } = recipe || {};
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

  return (
    <>
      <TextInput
        label="Name"
        name="name"
        id="recipe-form-name"
        defaultValue={name}
        onChange={(e) => setCurrentName(e.target.value)}
        errors={state.errors?.name}
      />
      <TextAreaInput
        label="Description"
        name="description"
        id="recipe-form-description"
        defaultValue={description}
        errors={state.errors?.description}
      />
      <ImageInput defaultImage={defaultImage} errors={state.errors?.image} />
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
    </>
  );
}
