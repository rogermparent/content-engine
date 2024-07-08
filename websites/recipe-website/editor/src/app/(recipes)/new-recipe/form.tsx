"use client";

import CreateRecipeFields from "recipes-collection/components/Form/Create";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { RecipeFormState } from "recipes-collection/controller/formState";
import createRecipe from "recipes-collection/controller/actions/create";
import { Recipe } from "recipes-collection/controller/types";

export default function NewRecipeForm({
  slug,
  recipe,
}: {
  slug?: string;
  recipe?: Partial<Recipe>;
}) {
  const initialState = { message: "", errors: {} } as RecipeFormState;
  const [state, dispatch] = useActionState(createRecipe, initialState);
  return (
    <form id="recipe-form" className="m-2 w-full" action={dispatch}>
      <h2 className="font-bold text-2xl mb-2">New Recipe</h2>
      <div className="flex flex-col flex-nowrap">
        <CreateRecipeFields state={state} slug={slug} recipe={recipe} />
        <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
          {state.message && (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
          )}
        </div>
        <div className="my-1">
          <SubmitButton>Submit</SubmitButton>
        </div>
      </div>
    </form>
  );
}
