"use client";

import CreateRecipeFields from "recipe-website-common/components/Form/Create";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import { createRecipe } from "recipe-editor/controller/actions";
import { importRecipeAction } from "./actions";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { RecipeActionState } from "./common";
import { ImportedRecipe } from "recipe-website-common/util/importRecipeData";

export function NewRecipeForm({
  recipe,
  slug,
}: {
  recipe?: Partial<ImportedRecipe>;
  slug?: string;
}) {
  const initialState = { message: "", errors: {} } as RecipeFormState;
  const [state, dispatch] = useActionState(createRecipe, initialState);
  return (
    <form id="recipe-form" className="m-2 w-full" action={dispatch}>
      <h2 className="font-bold text-2xl mb-2">New Recipe</h2>
      <div className="flex flex-col flex-nowrap">
        <CreateRecipeFields
          state={state}
          slug={slug}
          recipe={recipe || undefined}
        />
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

export default function NewOrImportRecipeForm({
  slug,
  initialState: initialImportState,
}: {
  slug?: string;
  initialState: RecipeActionState | null;
}) {
  const [importState, importDispatch] = useActionState(
    importRecipeAction,
    initialImportState,
  );

  const { recipe, message } = importState || {};

  return (
    <div>
      <form id="import-form" action={importDispatch}>
        {message ? <div className="bg-slate-800">{message}</div> : null}
        <TextInput name="import" label="Import from URL" />
        <SubmitButton>Import</SubmitButton>
      </form>
      <NewRecipeForm recipe={recipe} slug={slug} />
    </div>
  );
}
