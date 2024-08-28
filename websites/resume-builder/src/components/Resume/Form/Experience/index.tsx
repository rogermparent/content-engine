import { ResumeFormErrors } from "@/controller/formState";
import { Experience } from "@/controller/types";
import { Button } from "@/components/Button";
import {
  InputListControls,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { FieldWrapper } from "component-library/components/Form";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";

export function ExperienceListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: Experience[];
  placeholder?: string;
  errors?: ResumeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<Experience>(defaultValue);
  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const currentItemName = `${name}[${index}]`;
          return (
            <li key={key} className="flex flex-col my-1">
              <div>
                <TextInput
                  label="Company"
                  name={`${currentItemName}.company`}
                  defaultValue={defaultValue?.company}
                />
                <TextInput
                  label="Title"
                  name={`${currentItemName}.title`}
                  defaultValue={defaultValue?.title}
                />
                <TextInput
                  label="Start Date"
                  name={`${currentItemName}.startDate`}
                  defaultValue={defaultValue?.startDate}
                />
                <TextInput
                  label="End Date"
                  name={`${currentItemName}.endDate`}
                  defaultValue={defaultValue?.endDate}
                />
                <MarkdownInput
                  label="Description"
                  name={`${currentItemName}.description`}
                  defaultValue={defaultValue?.description}
                />
              </div>
              <div>
                <InputListControls dispatch={dispatch} index={index} />
              </div>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={() => {
          dispatch({ type: "APPEND" });
        }}
      >
        Append Item
      </Button>
    </FieldWrapper>
  );
}
