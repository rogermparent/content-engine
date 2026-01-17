"use client";

import { useMemo, useState } from "react";
import { FeaturedRecipeFormState } from "recipe-website-common/controller/featuredRecipeFormState";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";
import { RecipeSelectInput } from "recipe-website-common/components/Form/inputs/RecipeSelect";
import { FeaturedRecipe } from "recipe-website-common/controller/types";
import slugify from "@sindresorhus/slugify";
import createDefaultFeaturedRecipeSlug from "recipe-website-common/controller/createFeaturedRecipeSlug";

export default function FeaturedRecipeFields({
  featuredRecipe,
  state,
  slug,
}: {
  featuredRecipe?: Partial<FeaturedRecipe>;
  state?: FeaturedRecipeFormState;
  slug?: string;
}) {
  const { recipe, date, note } = featuredRecipe || {};
  const [currentTimezone] = useState<string>(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [defaultDate] = useState<number>(() => Date.now());
  const [defaultSlug] = useState<string>(() =>
    slugify(
      slug ||
        (date
          ? createDefaultFeaturedRecipeSlug({ date })
          : createDefaultFeaturedRecipeSlug({ date: defaultDate })),
    ),
  );

  return (
    <>
      <RecipeSelectInput
        label="Recipe"
        name="recipe"
        id="featured-recipe-form-recipe"
        defaultValue={recipe}
        errors={state?.errors?.recipe}
        required
      />
      <MarkdownInput
        label="Note"
        name="note"
        id="featured-recipe-form-note"
        defaultValue={note}
        errors={state?.errors?.note}
      />
      <details className="py-1 my-1" open>
        <summary className="text-sm font-semibold">Advanced</summary>
        <div className="flex flex-col flex-nowrap">
          <TextInput
            label="Slug"
            name="slug"
            id="featured-recipe-form-slug"
            defaultValue={slug}
            placeholder={defaultSlug}
            errors={state?.errors?.slug}
          />
          <DateTimeInput
            label="Date (UTC)"
            name="date"
            id="featured-recipe-form-date"
            date={date}
            currentTimezone={currentTimezone}
            errors={state?.errors?.date}
          />
        </div>
      </details>
    </>
  );
}
