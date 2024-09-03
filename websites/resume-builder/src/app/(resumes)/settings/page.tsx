import rebuildResumeIndex from "@/controller/actions/rebuildIndex";
import { SubmitButton } from "component-library/components/SubmitButton";

export default async function SettingsPage() {
  return (
    <main className="h-full w-full p-2 max-w-prose mx-auto grow">
      <h2 className="text-lg font-bold my-3">Database</h2>
      <div className="p-2">
        <form action={rebuildResumeIndex}>
          <SubmitButton>Reload Database</SubmitButton>
        </form>
      </div>
    </main>
  );
}
