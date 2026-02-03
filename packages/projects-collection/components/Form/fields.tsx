"use client";

import { useMemo, useState } from "react";
import slugify from "@sindresorhus/slugify";
import { Project } from "../../controller/types";
import { ProjectFormState } from "../../controller/formState";
import createDefaultSlug from "../../controller/createSlug";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { TextAreaInput } from "component-library/components/Form/inputs/TextArea";
import { StaticImageProps } from "next-static-image/src";
import { useCurrentTimezone } from "content-engine/hooks/useCurrentTimezone";

export default function ProjectFields({
  project,
  slug,
  state,
}: {
  project?: Partial<Project>;
  slug?: string;
  state: ProjectFormState;
  defaultImage?: StaticImageProps;
}) {
  const { name, date, content } = project || {};
  const [currentName, setCurrentName] = useState(name);
  const defaultSlug = useMemo(
    () => slugify(createDefaultSlug({ name: currentName || "" })),
    [currentName],
  );
  const currentTimezone = useCurrentTimezone();

  return (
    <>
      <TextInput
        label="Name"
        name="name"
        id="project-form-name"
        defaultValue={name}
        onChange={(e) => setCurrentName(e.target.value)}
        errors={state.errors?.name}
      />
      <TextAreaInput
        label="Content"
        name="content"
        id="project-form-content"
        defaultValue={content}
        errors={state.errors?.content}
      />
      <details className="py-1 my-1" open>
        <summary className="text-sm font-semibold">Advanced</summary>
        <div className="flex flex-col flex-nowrap">
          <TextInput
            label="Slug"
            name="slug"
            id="project-form-slug"
            defaultValue={slug}
            placeholder={defaultSlug}
            errors={state.errors?.slug}
          />
          <DateTimeInput
            label="Date (UTC)"
            name="date"
            id="project-form-date"
            date={date}
            currentTimezone={currentTimezone}
            errors={state.errors?.date}
          />
        </div>
      </details>
    </>
  );
}
