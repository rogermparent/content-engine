import { ResumeFormErrors } from "@/controller/formState";
import { Project } from "@/controller/types";
import { Button } from "@/components/Button";
import { FieldWrapper } from "component-library/components/Form";
import {
  InputListControls,
  TextListInput,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { MarkdownInput } from "component-library/components/Form/inputs/Markdown";

export function ProjectsListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: Project[];
  placeholder?: string;
  errors?: ResumeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<Project>(defaultValue);
  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemKey = `${name}[${index}]`;
          return (
            <li key={key} className="flex flex-col my-1">
              <div>
                <TextInput
                  label="Name"
                  name={`${itemKey}.name`}
                  defaultValue={defaultValue?.name}
                />
                <TextListInput
                  label="Url"
                  name={`${itemKey}.url`}
                  defaultValue={defaultValue?.url}
                  appendLabel="Append Project URL"
                />
                <TextInput
                  label="Start Date"
                  name={`${itemKey}.startDate`}
                  defaultValue={defaultValue?.startDate}
                />
                <TextInput
                  label="End Date"
                  name={`${itemKey}.endDate`}
                  defaultValue={defaultValue?.endDate}
                />
                <MarkdownInput
                  label="Description"
                  name={`${itemKey}.description`}
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
