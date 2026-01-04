import CreateForm from "./form";

export default async function NewResume() {
  return (
    <main className="flex flex-col items-center h-full w-full p-2 max-w-xl mx-auto grow bg-slate-950">
      <CreateForm />
    </main>
  );
}
