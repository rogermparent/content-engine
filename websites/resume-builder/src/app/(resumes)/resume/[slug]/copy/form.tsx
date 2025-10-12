"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { ResumeFormState } from "@/controller/formState";
import createResume from "@/controller/actions/createResume";
import { Resume } from "@/controller/types";
import UpdateResumeFields from "@/components/Resume/Form/Update";

export default function CopyResumeForm({ resume }: { resume: Resume }) {
  const initialState = { message: "", errors: {} } as ResumeFormState;
  const [state, dispatch] = useActionState(createResume, initialState);
  const { job, company, date, ...cleanedResume } = resume;
  return (
    <form className="w-full h-full flex flex-col grow" action={dispatch}>
      <UpdateResumeFields resume={cleanedResume} state={state} />
      <div id="missing-fields-error" aria-live="polite" aria-atomic="true">
        {state.message && (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        )}
      </div>
      <div className="my-1">
        <Button type="submit">
          <span>Submit</span>
        </Button>
      </div>
    </form>
  );
}
