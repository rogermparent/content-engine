import { importRecipeData } from "recipes-collection/util/importRecipeData";
import CreateForm from "./form";
import { Button } from "component-library/components/Button";
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
        <Button type="submit">Import</Button>
      </form>
      <CreateForm recipe={importedRecipe} />
    </main>
  );
}
