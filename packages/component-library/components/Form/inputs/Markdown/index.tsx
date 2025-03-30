import { useState } from "react";
import { Errors, FieldWrapper, baseInputStyle } from "../..";
import clsx from "clsx";
import StyledMarkdown from "component-library/components/Markdown";
import { Button } from "component-library/components/Button";
import { DefaultControls, MarkdownInputProps } from "./common";

export function MarkdownInput({
  name,
  id = name,
  defaultValue,
  label,
  errors,
  Controls = DefaultControls,
  components,
}: MarkdownInputProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [textArea, setTextArea] = useState<HTMLTextAreaElement | null>(null);

  return (
    <FieldWrapper label={label} id={id}>
      <Errors errors={errors} />
      <div className="flex flex-col border rounded-xs">
        <div className="flex border-b overflow-hidden">
          <Button
            overrideDefaultStyles={true}
            className={clsx(
              activeTab === "edit" ? "bg-blue-500 text-white" : "",
              "px-4 py-2",
            )}
            onClick={() => setActiveTab("edit")}
          >
            Write
          </Button>
          <Button
            overrideDefaultStyles={true}
            className={clsx(
              activeTab === "preview" ? "bg-blue-500 text-white" : "",
              "px-4 py-2",
            )}
            onClick={() => {
              setActiveTab("preview");
            }}
          >
            Preview
          </Button>
        </div>
        <div className={activeTab === "edit" ? "" : "hidden"}>
          <div className="flex gap-2 border-b p-2">
            <Controls textArea={textArea} />
          </div>
          <textarea
            name={name}
            id={id}
            ref={(el) => {
              setTextArea(el);
            }}
            className={clsx(baseInputStyle, "px-1 h-40 grow w-full")}
            defaultValue={defaultValue}
          />
        </div>
        {activeTab === "preview" ? (
          <div className={"p-2 markdown-body"}>
            <StyledMarkdown components={components}>
              {textArea?.value || ""}
            </StyledMarkdown>
          </div>
        ) : null}
      </div>
    </FieldWrapper>
  );
}
