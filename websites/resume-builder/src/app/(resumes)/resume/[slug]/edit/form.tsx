"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Resume } from "@/controller/types";
import { ResumeFormState } from "@/controller/formState";
import updateResume from "@/controller/actions/update";
import UpdateResumeFields from "@/components/Resume/Form/Update";

export default function EditResumeForm({
  resume,
  slug,
}: {
  slug: string;
  resume: Resume;
}) {
  const { date } = resume;
  const initialState = { message: "", errors: {} } as ResumeFormState;
  const updateThisResume = updateResume.bind(null, date, slug);
  const [state, dispatch] = useActionState(updateThisResume, initialState);
  return (
    <form className="w-full h-full flex flex-col grow" action={dispatch}>
      <UpdateResumeFields resume={resume} slug={slug} state={state} />
      <div className="flex flex-row flex-nowrap my-1">
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}
