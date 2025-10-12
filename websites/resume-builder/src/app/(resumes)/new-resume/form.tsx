"use client";

import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { Resume } from "@/controller/types";
import { ResumeFormState } from "@/controller/formState";
import createResume from "@/controller/actions/createResume";
import CreateResumeFields from "@/components/Resume/Form/Create";

export default function NewResumeForm({
  slug,
  resume,
}: {
  slug?: string;
  resume?: Partial<Resume>;
}) {
  const initialState = { message: "", errors: {} } as ResumeFormState;
  const [state, dispatch] = useActionState(createResume, initialState);
  return (
    <form id="resume-form" className="m-2 w-full" action={dispatch}>
      <h2 className="font-bold text-2xl mb-2">New Resume</h2>
      <div className="flex flex-col flex-nowrap">
        <CreateResumeFields state={state} slug={slug} resume={resume} />
        <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
          {state.message && (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
          )}
        </div>
        <div className="my-1">
          <SubmitButton>Submit</SubmitButton>
        </div>
      </div>
    </form>
  );
}
