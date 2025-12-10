"use client";

import { useEffect, useMemo, useState } from "react";
import { FeaturedRecipeFormState } from "recipe-website-common/controller/featuredRecipeFormState";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";
import { FeaturedRecipe } from "recipe-website-common/controller/types";
import { SelectInput } from "component-library/components/Form/inputs/Select";
import slugify from "@sindresorhus/slugify";
import createDefaultFeaturedRecipeSlug from "recipe-website-common/controller/createFeaturedRecipeSlug";

export default function FeaturedRecipeFields({
  featuredRecipe,
  state,
  slug,
  recipes,
}: {
  featuredRecipe?: Partial<FeaturedRecipe>;
  state?: FeaturedRecipeFormState;
  slug?: string;
  recipes?: { slug: string; name: string }[];
}) {
  const { recipe, date, note } = featuredRecipe || {};
  const [currentTimezone, setCurrentTimezone] = useState<string>();

  useEffect(() => {
    const fetchedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setCurrentTimezone(fetchedTimezone);
  }, []);

  const defaultSlug = useMemo(
    () => slugify(
      slug || (date ? createDefaultFeaturedRecipeSlug({ date }) : createDefaultFeaturedRecipeSlug({ date: Date.now() }))
    ),
    [slug, date],
  );

  return (
    <>
      {recipes && (
        <SelectInput
          label="Recipe"
          name="recipe"
          id="featured-recipe-form-recipe"
          defaultValue={recipe}
          errors={state?.errors?.recipe}
        >
          <option value="">Select a recipe</option>
          {recipes.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </SelectInput>
      )}
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

