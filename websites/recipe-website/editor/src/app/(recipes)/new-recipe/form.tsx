"use client";

import CreateRecipeFields from "recipe-website-common/components/Form/Create";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import { createRecipe } from "recipe-editor/controller/actions";
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

  const { recipe, message } = importState || {};

  const initialSubmissionState = { message: "", errors: {} } as RecipeFormState;
  const [submissionState, submissionDispatch] = useActionState(
    createRecipe,
    initialSubmissionState,
  );

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
            state={submissionState}
            slug={slug}
            recipe={recipe || undefined}
          />
          <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
            {submissionState.message && (
              <p className="mt-2 text-sm text-red-500">
                {submissionState.message}
              </p>
            )}
          </div>
          <div className="my-1">
            <SubmitButton>Submit</SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
