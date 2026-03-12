"use client";

import CreateRecipeFields from "recipe-website-common/components/Form/Create";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import {
  createRecipe,
  overwriteRecipe,
} from "recipe-editor/controller/actions";
import { importRecipeAction } from "./actions";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { RecipeActionState } from "./common";

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

  const { recipe, message, url } = importState || {};

  const initialSubmissionState = { message: "", errors: {} } as RecipeFormState;
  const [submissionState, submissionDispatch] = useActionState(
    createRecipe,
    initialSubmissionState,
  );
  const [, overwriteDispatch] = useActionState(overwriteRecipe, null);

  return (
    <div>
      <form id="import-form" action={importDispatch}>
        {message ? <div className="bg-slate-800">{message}</div> : null}
        <TextInput name="import" label="Import from URL" />
        <SubmitButton>Import</SubmitButton>
      </form>
      <form id="recipe-form" className="m-2 w-full" action={submissionDispatch}>
        <h2 className="font-bold text-2xl mb-2">New Recipe</h2>
        <div className="flex flex-col flex-nowrap">
          <CreateRecipeFields
            key={submissionState.formData ? submissionState.message : url}
            state={submissionState}
            slug={slug}
            recipe={submissionState.formData || recipe || undefined}
          />
          <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
            {submissionState.message && (
              <p className="mt-2 text-sm text-red-500">
                {submissionState.message}
              </p>
            )}
          </div>
          <div className="my-1 flex gap-2">
            <SubmitButton>Submit</SubmitButton>
            {submissionState.slugConflict && (
              <button
                formAction={overwriteDispatch}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Overwrite
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
