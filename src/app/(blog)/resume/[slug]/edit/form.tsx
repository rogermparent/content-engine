"use client";

import ResumeFields from "@/components/Resume/Form/Update";
import { useFormState } from "react-dom";
import { Button } from "@/components/Button";
import { Resume } from "@/app/lib/models/resumes/types";
import { ResumeFormState } from "@/app/lib/models/resumes/formState";
import updateResume from "@/app/lib/models/resumes/actions/update";

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
  const [state, dispatch] = useFormState(updateThisResume, initialState);
  return (
    <form className="w-full h-full flex flex-col grow" action={dispatch}>
      <ResumeFields resume={resume} slug={slug} state={state} />
      <div className="flex flex-row flex-nowrap my-1">
        <Button>Submit</Button>
      </div>
    </form>
  );
}
