import CreateForm from "./form";
import { SubmitButton } from "component-library/components/SubmitButton";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { auth, signIn } from "@/auth";
import { importRecipeAction, RecipeActionState } from "./actions";
import { useActionState } from "react";
import { reduceRecipeImport } from "./common";

export default async function NewRecipe({
  searchParams,
}: {
  searchParams: Promise<{ import?: string }>;
}) {
  const { import: importURL } = await searchParams;
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/new-recipe`,
    });
  }

  const initialState = importURL
    ? await reduceRecipeImport(null, importURL)
    : null;

  return (
    <main className="flex flex-col items-center h-full w-full p-2 max-w-prose mx-auto grow bg-slate-950">
      <CreateForm initialState={initialState} />
    </main>
  );
}
