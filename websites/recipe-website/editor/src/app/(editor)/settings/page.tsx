import rebuildRecipeIndex from "recipe-editor/controller/actions/rebuildIndex";
import { auth, signIn } from "@/auth";
import { SubmitButton } from "component-library/components/SubmitButton";

export default async function SettingsPage() {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/settings`,
    });
  }
  return (
    <main className="h-full w-full p-2 max-w-prose mx-auto grow">
      <h2 className="text-lg font-bold my-3">Database</h2>
      <div className="p-2">
        <form action={rebuildRecipeIndex}>
          <SubmitButton>Reload Database</SubmitButton>
        </form>
      </div>
    </main>
  );
}
