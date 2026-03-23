"use client";

import UpdateProjectFields from "@discontent/projects-collection/components/Form/Update";
import { useActionState } from "react";
import { Button } from "@discontent/component-library/components/Button";
import { Project } from "@discontent/projects-collection/controller/types";
import { ProjectFormState } from "@discontent/projects-collection/controller/formState";
import updateProject from "@discontent/projects-collection/controller/actions/update";
import Link from "next/link";

export default function EditProjectForm({
  project,
  slug,
}: {
  slug: string;
  project: Project;
}) {
  const initialState = { message: "", errors: {} } as ProjectFormState;
  const updateThisProject = updateProject.bind(null, slug);
  const [state, dispatch] = useActionState(updateThisProject, initialState);
  return (
    <form
      id="project-form"
      className="w-full h-full flex flex-col grow"
      action={dispatch}
    >
      <UpdateProjectFields project={project} slug={slug} state={state} />
      <div className="flex flex-row flex-nowrap my-1">
        <Button type="submit">Submit</Button>
      </div>
      <div>
        <Link href="/projects">Back to Projects</Link>
      </div>
    </form>
  );
}
