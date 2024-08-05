"use client";

import UpdateRecipeFields from "recipe-website-common/components/Form/Update";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { Recipe } from "recipe-website-common/controller/types";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import createRecipe from "recipe-website-common/controller/actions/create";

export default function CopyRecipeForm({ recipe }: { recipe: Recipe }) {
  const initialState = { message: "", errors: {} } as RecipeFormState;
  const [state, dispatch] = useActionState(createRecipe, initialState);
  const { name, date, ...cleanedRecipe } = recipe;
  return (
    <form
      id="recipe-form"
      className="w-full h-full flex flex-col grow"
      action={dispatch}
    >
      <UpdateRecipeFields recipe={cleanedRecipe} state={state} />
      <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
        {state.message && (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        )}
      </div>
      <div className="my-1">
        <SubmitButton>Submit</SubmitButton>
      </div>
    </form>
  );
}
