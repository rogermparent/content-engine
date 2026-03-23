"use client";

import {
  ListInput,
  ListItemProps,
} from "@discontent/component-library/components/Form/inputs/List";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";
import { SelectInput } from "@discontent/component-library/components/Form/inputs/Select";
import { ContactLink } from "../types";

function ContactLinkInput({ name, defaultValue }: ListItemProps<ContactLink>) {
  return (
    <>
      <TextInput
        name={`${name}.label`}
        label="Label"
        defaultValue={defaultValue?.label || ""}
      />
      <TextInput
        name={`${name}.link`}
        label="Link"
        defaultValue={defaultValue?.link || ""}
      />
      <TextInput
        name={`${name}.icon`}
        label="Icon"
        defaultValue={defaultValue?.icon || ""}
      />
      <SelectInput
        name={`${name}.iconType`}
        label="Type"
        defaultValue={defaultValue?.iconType || ""}
      >
        <option value="inlineSvg">Inline SVG</option>
        <option value="text">Text</option>
      </SelectInput>
    </>
  );
}

export default function HomepageContactLinksInput({
  name = "contactLinks",
  defaultValue,
}: {
  name?: string;
  defaultValue?: ContactLink[];
}) {
  return (
    <ListInput
      label="Contact Links"
      Item={ContactLinkInput}
      name={name}
      defaultValue={defaultValue}
    />
  );
}
