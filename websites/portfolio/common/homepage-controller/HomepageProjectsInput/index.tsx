"use client";

import {
  ListInput,
  ListItemProps,
} from "@discontent/component-library/components/Form/inputs/List";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";
import { ImageInput } from "@discontent/component-library/components/Form/inputs/Image";
import { TextAreaInput } from "@discontent/component-library/components/Form/inputs/TextArea";
import { HomepageProjectItem, LinkItem } from "../types";

function LinkInput({ name, defaultValue }: ListItemProps<LinkItem>) {
  return (
    <div>
      <TextInput
        name={`${name}.label`}
        label="Label"
        defaultValue={defaultValue?.label || ""}
      />
      <TextInput
        name={`${name}.link`}
        label="link"
        defaultValue={defaultValue?.link || ""}
      />
    </div>
  );
}

function ProjectInput({
  name,
  defaultValue,
}: ListItemProps<HomepageProjectItem>) {
  return (
    <>
      <input
        type="hidden"
        name={`${name}.existingImage`}
        value={defaultValue?.image}
      />
      <ImageInput
        name={`${name}.image`}
        clearImageName={`${name}.clearImage`}
        label="Image"
        defaultImage={defaultValue?.existingImage}
      />
      <TextInput
        name={`${name}.name`}
        label="Name"
        defaultValue={defaultValue?.name || ""}
      />
      <ListInput
        Item={LinkInput}
        name={`${name}.links`}
        label="Links"
        defaultValue={defaultValue?.links}
      />
      <TextAreaInput
        name={`${name}.description`}
        label="Description"
        defaultValue={defaultValue?.description || ""}
      />
    </>
  );
}

export default function HomepageProjectsInput({
  name = "projects",
  defaultValue,
}: {
  name?: string;
  defaultValue?: HomepageProjectItem[];
}) {
  return (
    <ListInput
      label="Projects"
      Item={ProjectInput}
      name={name}
      defaultValue={defaultValue}
    />
  );
}
