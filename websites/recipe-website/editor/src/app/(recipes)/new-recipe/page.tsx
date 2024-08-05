import { importRecipeData } from "recipe-website-common/util/importRecipeData";
import CreateForm from "./form";
import { SubmitButton } from "component-library/components/SubmitButton";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { auth, signIn } from "@/auth";

export default async function NewRecipe({
  searchParams: { import: importURL },
}: {
  searchParams: { import?: string };
}) {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/new-recipe`,
    });
  }
  const importedRecipe = importURL
    ? await importRecipeData(importURL)
    : undefined;
  return (
    <main className="flex flex-col items-center h-full w-full p-2 max-w-prose mx-auto grow bg-slate-950">
      <form id="import-form">
        <TextInput name="import" label="Import from URL" />
        <SubmitButton>Import</SubmitButton>
      </form>
      <CreateForm recipe={importedRecipe} />
    </main>
  );
}
