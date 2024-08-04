"use client";

import { InlineMarkdownInput } from "component-library/components/Form/inputs/Markdown/Inline";
import { MarkdownInputProps } from "component-library/components/Form/inputs/Markdown/common";
import { DummyMultiplyable, RecipeCustomControls } from "../../RecipeMarkdown";

export default function IngredientInput({
  name,
  id,
  label,
  defaultValue,
  errors,
}: MarkdownInputProps) {
  return (
    <InlineMarkdownInput
      name={name}
      id={id}
      label={label}
      defaultValue={defaultValue}
      errors={errors}
      Controls={RecipeCustomControls}
      components={{ Multiplyable: DummyMultiplyable }}
    />
  );
}
