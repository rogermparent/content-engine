"use client";

import UpdateRecipeFields from "recipe-website-common/components/Form/Update";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { Recipe } from "recipe-website-common/controller/types";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import { StaticImageProps } from "next-static-image/src";
import {
  updateRecipe,
  overwriteUpdateRecipe,
} from "../../../../../../controller/actions";

export default function EditRecipeForm({
  recipe,
  slug,
  defaultImage,
}: {
  slug: string;
  recipe: Recipe;
  defaultImage?: StaticImageProps | undefined;
}) {
  const { date } = recipe;
  const initialState = { message: "", errors: {} } as RecipeFormState;
  const updateThisRecipe = updateRecipe.bind(null, date, slug);
  const [state, dispatch] = useActionState(updateThisRecipe, initialState);
  const overwriteThisRecipe = overwriteUpdateRecipe.bind(null, date, slug);
  const [, overwriteDispatch] = useActionState(overwriteThisRecipe, null);
  const effectiveRecipe = state.formData
    ? { ...recipe, ...state.formData }
    : recipe;

  return (
    <form
      id="recipe-form"
      className="w-full h-full flex flex-col grow"
      action={dispatch}
    >
      <UpdateRecipeFields
        key={state.formData ? state.message : undefined}
        recipe={effectiveRecipe}
        slug={state.formData?.slug || slug}
        state={state}
        defaultImage={defaultImage}
      />
      <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
        {state.message && (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        )}
      </div>
      <div className="flex flex-row flex-nowrap my-1 gap-2">
        <SubmitButton>Submit</SubmitButton>
        {state.slugConflict && (
          <button
            formAction={overwriteDispatch}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Overwrite
          </button>
        )}
      </div>
    </form>
  );
}
