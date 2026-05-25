"use client";

import { ReactNode } from "react";
import { RecipeFormProvider, useRecipeFormInstance } from "./formContext";
import { ImportedRecipe } from "recipe-website-common/util/importRecipeData";

/**
 * Owns the TanStack Form instance for the recipe form and shares it with the
 * field components (RecipeFields) via context. Submission stays native
 * FormData -> Server Action (`action`); TanStack Form layers on controlled
 * state and client-side validation. `onSubmit` runs the form's validators
 * alongside the server's, which remain authoritative.
 *
 * Children (the fields, messages, submit/overwrite buttons) are provided by
 * each page wrapper so their differing layouts are preserved.
 */
export function RecipeFormShell({
  action,
  recipe,
  slug,
  className,
  children,
}: {
  action: (formData: FormData) => void;
  recipe?: Partial<ImportedRecipe>;
  slug?: string;
  className?: string;
  children: ReactNode;
}) {
  const form = useRecipeFormInstance(recipe, slug);

  return (
    <RecipeFormProvider value={form}>
      <form
        id="recipe-form"
        className={className}
        action={action}
        onSubmit={() => form.handleSubmit()}
      >
        {children}
      </form>
    </RecipeFormProvider>
  );
}
