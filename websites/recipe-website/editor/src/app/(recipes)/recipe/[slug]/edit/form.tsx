"use client";

import UpdateRecipeFields from "recipe-website-common/components/Form/Update";
import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { Recipe } from "recipe-website-common/controller/types";
import { RecipeFormState } from "recipe-website-common/controller/formState";
import { StaticImageProps } from "next-static-image/src";
import { updateRecipe } from "../../../../../../controller/actions";

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
  return (
    <form
      id="recipe-form"
      className="w-full h-full flex flex-col grow"
      action={dispatch}
    >
      <UpdateRecipeFields
        recipe={recipe}
        slug={slug}
        state={state}
        defaultImage={defaultImage}
      />
      <div className="flex flex-row flex-nowrap my-1">
        <SubmitButton>Submit</SubmitButton>
      </div>
    </form>
  );
}
