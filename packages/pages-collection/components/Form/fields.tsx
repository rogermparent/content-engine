"use client";

import { useMemo, useState } from "react";
import slugify from "@sindresorhus/slugify";
import { Page } from "../../controller/types";
import { PageFormState } from "../../controller/formState";
import createDefaultSlug from "../../controller/createSlug";
import { DateTimeInput } from "@discontent/component-library/components/Form/inputs/DateTime";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";
import { MarkdownInput } from "@discontent/component-library/components/Form/inputs/Markdown";
import { StaticImageProps } from "@discontent/next-static-image/src";
import { useCurrentTimezone } from "@discontent/cms/hooks/useCurrentTimezone";

export default function PageFields({
  page,
  slug,
  state,
}: {
  page?: Partial<Page>;
  slug?: string;
  state: PageFormState;
  defaultImage?: StaticImageProps;
}) {
  const { name, date, content } = page || {};
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
        id="page-form-name"
        defaultValue={name}
        onChange={(e) => setCurrentName(e.target.value)}
        errors={state.errors?.name}
      />
      <MarkdownInput
        label="Content"
        name="content"
        id="page-form-content"
        defaultValue={content}
        errors={state.errors?.content}
      />
      <details className="py-1 my-1" open>
        <summary className="text-sm font-semibold">Advanced</summary>
        <div className="flex flex-col flex-nowrap">
          <TextInput
            label="Slug"
            name="slug"
            id="page-form-slug"
            defaultValue={slug}
            placeholder={defaultSlug}
            errors={state.errors?.slug}
          />
          <DateTimeInput
            label="Date (UTC)"
            name="date"
            id="page-form-date"
            date={date}
            currentTimezone={currentTimezone}
            errors={state.errors?.date}
          />
        </div>
      </details>
    </>
  );
}
