"use client";

import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";
import { MarkdownInputProps } from "component-library/components/Form/inputs/Markdown/common";
import {
  DummyMultiplyable,
  DummyVideoTime,
  RecipeCustomControls,
} from "../../RecipeMarkdown";

export default function InstructionTextInput({
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
      Controls={RecipeCustomControls}
      components={{
        Multiplyable: DummyMultiplyable,
        VideoTime: DummyVideoTime,
      }}
    />
  );
}
