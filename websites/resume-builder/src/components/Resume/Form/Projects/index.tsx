import { ResumeFormErrors } from "@/controller/formState";
import { Project } from "@/controller/types";
import { Button } from "@/components/Button";
import {
  FieldWrapper,
  InputListControls,
  TextAreaInput,
  TextInput,
  TextListInput,
  useKeyList,
} from "@/components/Form";

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
  const [{ keys, defaultValues }, dispatch] = useKeyList<Project>(defaultValue);
  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {keys.map((key, index) => {
          const itemKey = `${name}[${index}]`;
          const currentDefaultItem = defaultValues?.[index];
          return (
            <li key={key} className="flex flex-col my-1">
              <div>
                <TextInput
                  label="Name"
                  name={`${itemKey}.name`}
                  defaultValue={currentDefaultItem?.name}
                />
                <TextListInput
                  label="Url"
                  name={`${itemKey}.url`}
                  defaultValue={currentDefaultItem?.url}
                  appendLabel="Append Project URL"
                />
                <TextInput
                  label="Start Date"
                  name={`${itemKey}.startDate`}
                  defaultValue={currentDefaultItem?.startDate}
                />
                <TextInput
                  label="End Date"
                  name={`${itemKey}.endDate`}
                  defaultValue={currentDefaultItem?.endDate}
                />
                <TextAreaInput
                  label="Description"
                  name={`${itemKey}.description`}
                  defaultValue={currentDefaultItem?.description}
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
