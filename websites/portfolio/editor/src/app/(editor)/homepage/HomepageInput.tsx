"use client";

import { MarkdownInputProps } from "@discontent/component-library/components/Form/inputs/Markdown/common";
import { MarkdownInput } from "@discontent/component-library/components/Form/inputs/Markdown";

export default function HomepageMarkdownInput({
  name,
  id,
  label,
  defaultValue,
  errors,
}: MarkdownInputProps) {
  return (
    <MarkdownInput
      name={name}
      id={id}
      label={label}
      defaultValue={defaultValue}
      errors={errors}
    />
  );
}
