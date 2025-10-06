import CreateForm from "./form";
import { auth, signIn } from "@/auth";
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
